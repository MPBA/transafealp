
------------------------------------------------------------------------------------------
-- EVENT (LIVE STATUS)
------------------------------------------------------------------------------------------

--Live event running
DROP TABLE IF EXISTS event CASCADE;
CREATE TABLE IF NOT EXISTS event (
	id BIGSERIAL PRIMARY KEY,
	managing_authority_id BIGINT REFERENCES managing_authority(id) ON UPDATE CASCADE ON DELETE SET NULL,
	event_name TEXT NOT NULL,
	event_description TEXT NOT NULL,
	category_name TEXT NOT NULL,
	category_description TEXT NOT NULL,
	subcategory_name TEXT NOT NULL,
	subcategory_description TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
	is_real BOOLEAN NOT NULL DEFAULT FALSE,
	time_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	time_end TIMESTAMP,
	event_geom Geometry(Point,3035) NOT NULL,
	scenario_geom Geometry(Multipolygon,3035) NOT NULL
);
--SELECT 'SRID=3035;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))'::geometry;

------------------------------------------------------------------------------------------
-- ACTION GRAPH, ACTORS AND VISUALIZATIONS
------------------------------------------------------------------------------------------

--live event actions
DROP TABLE IF EXISTS ev_action CASCADE;
CREATE TABLE IF NOT EXISTS ev_action (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT NOT NULL,
	numcode INTEGER NOT NULL DEFAULT 0,
	description TEXT NOT NULL,
	duration INTEGER NOT NULL DEFAULT 15 CHECK ((duration >= 0) AND (duration%15 = 0)),
	status TEXT NOT NULL DEFAULT 'non executable'
		CHECK (status IN ('executable','non executable','running',
			'terminated (success)','terminated (not needed)','terminated (failed)')),
	comment TEXT, 
	UNIQUE (event_id, name)
);


-----------------------------------------------------------------------------------------------------------
--
--                                               (user)                                           (user)
--                          +----------------------------------------------+                   +----------+
--                          |                                              |                   |          |
--                (auto)    |        (user)          (user)                V                   V          |
--[NON EXECUTABLE]------>[EXECUTABLE]------>[RUNNING]------>[TERMINATED (success/failure/not needed)]-----+
--         ^               |   ^                 ^                   |          |
--         +---------------+   |                 +-------------------+          |
--           (auto revert)     |                     (user revert)              |
--                             |                                                |
--                             +------------------------------------------------+
--                                              (user revert)
--
-----------------------------------------------------------------------------------------------------------
--Check status lifecycle
DROP FUNCTION IF EXISTS ev_action_next_status(BIGINT) CASCADE;
CREATE OR REPLACE FUNCTION ev_action_next_status(ev_action_id BIGINT, OUT available_statuses TEXT[], OUT reason TEXT) AS
$BODY$
DECLARE
	a ev_action;
	tarr text[];
BEGIN
	SELECT INTO a * FROM ev_action WHERE id = ev_action_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Action % not found!', ev_action_id;
	END IF;

	IF (a.status = 'non executable') THEN
		--check if there are non terminated parents
		FOR a IN SELECT ea.* FROM ev_action_graph ag LEFT JOIN ev_action ea ON ea.id = ag.parent_id
			WHERE ag.action_id = ev_action_id
		LOOP
			IF a.status IN ('executable','non executable','running') THEN
				tarr = tarr || a.name;
			END IF;
		END LOOP;
		IF (array_length(tarr, 1) > 0) THEN
			reason = 'Parent action(s) ' || array_to_string(tarr, ', ', '') || ' not completed';
		ELSE
			reason = 'All previous acions are completed.';
			available_statuses = ARRAY['executable'];
		END IF;
		
	ELSIF (a.status = 'executable') THEN
		available_statuses = ARRAY['non executable','running','terminated (success)',
			'terminated (not needed)','terminated (failed)'];
		reason = 'All previous acions are completed.';
		
	ELSIF (a.status = 'running') THEN
		available_statuses = ARRAY['terminated (success)','terminated (not needed)','terminated (failed)'];
		reason = 'Action is running and can be completed.';
		
	ELSIF (a.status IN ('terminated (success)','terminated (not needed)','terminated (failed)')) THEN
		--check if there are running or terminated children
		FOR a IN SELECT ea.* FROM ev_action_graph ag LEFT JOIN ev_action ea ON ea.id = ag.action_id
			WHERE ag.parent_id = ev_action_id
		LOOP
			IF a.status IN ('running','terminated (success)','terminated (not needed)','terminated (failed)') THEN
				tarr = tarr || a.name;
			END IF;
		END LOOP;
		IF (array_length(tarr, 1) > 0) THEN
			reason = 'Child(ren) Action(s) ' || array_to_string(tarr, ', ', '') 
				|| ' completed or running. Action cannot be reverted';
			available_statuses = ARRAY['terminated (success)','terminated (not needed)','terminated (failed)'];
		ELSE
			reason = 'Action is completed and can reverted to another status.';
			available_statuses = ARRAY['executable','non executable','terminated (success)',
				'terminated (not needed)','terminated (failed)'];
		END IF;
	END IF;
	
	RETURN;
END
$BODY$
LANGUAGE plpgsql;

--trigger on update: check if status is available
DROP FUNCTION IF EXISTS update_ev_action() CASCADE;
CREATE OR REPLACE FUNCTION update_ev_action() RETURNS TRIGGER AS
$BODY$
BEGIN
	IF ((OLD.status != NEW.status) AND
		(NEW.status NOT IN (SELECT unnest(available_statuses) FROM ev_action_next_status(OLD.id)))
	) THEN
		RAISE EXCEPTION 'Status (%) not available for action %!', NEW.status,OLD.name;
	END IF;
	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION update_ev_action() IS '';
DROP TRIGGER IF EXISTS update_ev_action ON ev_action CASCADE;
CREATE TRIGGER update_ev_action BEFORE UPDATE ON ev_action FOR EACH ROW EXECUTE PROCEDURE update_ev_action();

--trigger after update: propagate action statuses
DROP FUNCTION IF EXISTS after_update_ev_action() CASCADE;
CREATE OR REPLACE FUNCTION after_update_ev_action() RETURNS TRIGGER AS
$BODY$
BEGIN
	IF (OLD.status != NEW.status) THEN

		--set all children to 'non executable' since the parent action was reverted to a non terminated status
		IF (OLD.status IN ('terminated (success)','terminated (not needed)','terminated (failed)')
			AND NEW.status IN ('executable','running'))
		THEN
			UPDATE ev_action SET status = 'non executable' WHERE id IN 
				(SELECT action_id FROM ev_action_graph WHERE parent_id = NEW.id);
		END IF;

		--check if some children can be marked as 'executable' (only if all parents are teminated)
		IF (OLD.status IN ('executable','running')
			AND NEW.status IN ('terminated (success)','terminated (not needed)','terminated (failed)'))
		THEN
			UPDATE ev_action SET status = 'executable' WHERE id IN 
				(SELECT y.action_id FROM (
					SELECT x.action_id,
						unnest((ev_action_next_status(x.action_id)).available_statuses) available_status
						FROM (SELECT action_id FROM ev_action_graph WHERE parent_id = NEW.id) x
					) y WHERE y.available_status = 'executable'
				);
		END IF;

	END IF;
	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION after_update_ev_action() IS '';
DROP TRIGGER IF EXISTS after_update_ev_action ON ev_action CASCADE;
CREATE TRIGGER after_update_ev_action AFTER UPDATE ON ev_action
	FOR EACH ROW EXECUTE PROCEDURE after_update_ev_action();

/*SELECT 'executable' IN (SELECT unnest(available_statuses) FROM ev_action_next_status(1))
SELECT unnest(available_statuses) FROM ev_action_next_status(1);
UPDATE ev_action SET status = 'executable' WHERE id = 1;
select * from ev_action_next_status(1);

select * from ev_action;

SELECT y.action_id FROM (
SELECT x.action_id,unnest((ev_action_next_status(x.action_id)).available_statuses) available_status
	FROM (SELECT action_id FROM ev_action_graph WHERE parent_id = 1) x
) y WHERE y.available_status = 'executable';*/

--trigger on delete: disable deleting actions for running events
DROP FUNCTION IF EXISTS delete_ev_action() CASCADE;
CREATE OR REPLACE FUNCTION delete_ev_action() RETURNS TRIGGER AS
$BODY$
BEGIN
	PERFORM id FROM event WHERE id = OLD.event_id AND status = 'open';
	IF FOUND THEN
		RAISE EXCEPTION 'Cannot delete actions of a running event (event id: %)',OLD.event_id;
	END IF;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION delete_ev_action() IS '';
DROP TRIGGER IF EXISTS delete_ev_action ON ev_action CASCADE;
CREATE TRIGGER delete_ev_action BEFORE DELETE ON ev_action
	FOR EACH ROW EXECUTE PROCEDURE delete_ev_action();

------------------------------------------------------------------------------------------

--event action graph
DROP TABLE IF EXISTS ev_action_graph CASCADE;
CREATE TABLE IF NOT EXISTS ev_action_graph (
	id BIGSERIAL PRIMARY KEY,
	action_id BIGINT NOT NULL REFERENCES ev_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	parent_id BIGINT NOT NULL REFERENCES ev_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	is_main_parent BOOLEAN NOT NULL DEFAULT TRUE,
	UNIQUE (action_id, parent_id)
);


------------------------------------------------------------------------------------------

--attori delle azioni
DROP TABLE IF EXISTS ev_actor CASCADE;
CREATE TABLE IF NOT EXISTS ev_actor (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT NOT NULL,
	istitution TEXT NOT NULL,
	contact_info TEXT NOT NULL,
	email TEXT NOT NULL,
	phone TEXT NOT NULL,
	UNIQUE (event_id, email)
);

--attori associati alle azioni
DROP TABLE IF EXISTS ev_action_m2m_actor CASCADE;
CREATE TABLE IF NOT EXISTS ev_action_m2m_actor (
	id BIGSERIAL PRIMARY KEY,
	action_id BIGINT NOT NULL REFERENCES ev_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	actor_id BIGINT NOT NULL REFERENCES ev_actor(id) ON UPDATE CASCADE ON DELETE CASCADE,
	UNIQUE (action_id, actor_id)
);

--visualizzazioni che il JITES deve mostrare quando una azione viene selezionata
DROP TABLE IF EXISTS ev_visualization CASCADE;
CREATE TABLE IF NOT EXISTS ev_visualization (
	id BIGSERIAL PRIMARY KEY,
	action_id BIGINT NOT NULL REFERENCES ev_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	description TEXT,
	type TEXT NOT NULL,
	resource TEXT NOT NULL,
	options TEXT
);

DROP TABLE IF EXISTS ev_message CASCADE;
CREATE TABLE IF NOT EXISTS ev_message (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	username TEXT NOT NULL,
	content TEXT NOT NULL,
	UNIQUE (event_id,ts,username)
);

------------------------------------------------------------------------------------------
-- EVENT LOG
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS event_log CASCADE;
CREATE TABLE IF NOT EXISTS event_log (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	txid BIGINT NOT NULL DEFAULT txid_current(),
	ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	table_name TEXT NOT NULL,
	action TEXT NOT NULL CHECK (action IN ('I','U')),
	row_id BIGINT NOT NULL,
	fields hstore NOT NULL
);

CREATE OR REPLACE FUNCTION ev_logger() RETURNS TRIGGER AS
$BODY$
DECLARE
    audit_row event_log;
BEGIN
	IF (TG_WHEN <> 'AFTER') THEN
		RAISE EXCEPTION 'ev_logger() may only run as an AFTER trigger';
	END IF;

	IF NOT (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
		RAISE EXCEPTION 'ev_logger() may only be used on UPDATE and INSERT operations';
	END IF;

	IF (TG_TABLE_NAME = 'event') THEN
		audit_row = ROW(
			nextval('event_log_id_seq'), -- event_log id
			NEW.id, -- event_id
			txid_current(),
			statement_timestamp(),
			TG_TABLE_NAME::text, -- table_name
			substring(TG_OP,1,1), -- action
			NEW.id, -- row_id (same as event_id)
			hstore('') --fields
		);
	ELSE
		audit_row = ROW(
			nextval('event_log_id_seq'), -- event_log id
			NEW.event_id, -- event_id
			txid_current(),
			statement_timestamp(),
			TG_TABLE_NAME::text, -- table_name
			substring(TG_OP,1,1), -- action
			NEW.id, -- row_id
			hstore('') --fields
		);
	END IF;

	IF (TG_OP = 'UPDATE') THEN
		audit_row.fields = (hstore(NEW.*) - hstore(OLD.*));
		IF audit_row.fields = hstore('') THEN RETURN NULL; END IF; --skip empty updates
	ELSIF (TG_OP = 'INSERT') THEN
		audit_row.fields = hstore(NEW.*);
	END IF;

	INSERT INTO event_log VALUES (audit_row.*);
	RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql;

--adding log tigger to tables
DROP TRIGGER IF EXISTS ev_logger ON event CASCADE;
CREATE TRIGGER ev_logger AFTER INSERT OR UPDATE ON event FOR EACH ROW EXECUTE PROCEDURE ev_logger();
DROP TRIGGER IF EXISTS ev_logger ON ev_message CASCADE;
CREATE TRIGGER ev_logger AFTER INSERT OR UPDATE ON ev_message FOR EACH ROW EXECUTE PROCEDURE ev_logger();
DROP TRIGGER IF EXISTS ev_logger ON ev_action CASCADE;
CREATE TRIGGER ev_logger AFTER INSERT OR UPDATE ON ev_action FOR EACH ROW EXECUTE PROCEDURE ev_logger();
