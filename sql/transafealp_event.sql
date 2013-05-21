
------------------------------------------------------------------------------------------
-- EVENT (LIVE STATUS)
------------------------------------------------------------------------------------------

--Live event running
DROP TABLE IF EXISTS event CASCADE;
CREATE TABLE IF NOT EXISTS event (
	id BIGSERIAL PRIMARY KEY,
	scenario_id BIGINT REFERENCES scenario(id) ON UPDATE CASCADE ON DELETE SET NULL,
	scenario_name TEXT NOT NULL,
	scenario_description TEXT NOT NULL,
	category_name TEXT NOT NULL,
	category_description TEXT NOT NULL,
	subcategory_name TEXT NOT NULL,
	subcategory_description TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
	is_real BOOLEAN NOT NULL DEFAULT FALSE,
	time_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	time_end TIMESTAMP,
	geom geometry NOT NULL CHECK (st_ndims(geom) = 2 AND st_srid(geom) = 3035 AND geometrytype(geom) = 'MULTIPOLYGON'::text)
);
SELECT 'SRID=3035;MULTIPOLYGON(((0 0,0 1,1 1,1 0,0 0)))'::geometry;
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
------------------------------------------------------------------------------------------
-- ACTION GRAPH, ACTORS AND VISUALIZATIONS
------------------------------------------------------------------------------------------

--live event actions
DROP TABLE IF EXISTS ev_action CASCADE;
CREATE TABLE IF NOT EXISTS ev_action (
	id BIGINT PRIMARY KEY DEFAULT nextval('action_id_seq'),
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT NOT NULL,
	numcode INTEGER NOT NULL DEFAULT 0,
	description TEXT NOT NULL,
	duration INTEGER NOT NULL DEFAULT 15 CHECK ((duration >= 0) AND (duration%15 = 0)),
	status TEXT NOT NULL DEFAULT 'non executable'
		CHECK (status IN ('executable','non executable','running',
			'terminated (success)','terminated (not needed)','terminated (failed)')),
	comment TEXT, 
	UNIQUE(event_id,name)
);

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
	id BIGINT PRIMARY KEY DEFAULT nextval('actor_id_seq'),
	name TEXT NOT NULL,
	istitution TEXT NOT NULL,
	contact_info TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	phone TEXT NOT NULL
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
	id BIGINT PRIMARY KEY DEFAULT nextval('visualization_id_seq'),
	action_id BIGINT NOT NULL REFERENCES ev_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	description TEXT,
	type TEXT NOT NULL,
	resource TEXT NOT NULL,
	options TEXT
);

select * from audit.audit_table(
	'public.ev_action', --table name
	TRUE, --audit row change
	TRUE, --audit query text
	ARRAY['id','event_id','numcode'] --ignored columns
);

select * from audit.audit_table(
	'public.event', --table name
	TRUE, --audit row change
	TRUE, --audit query text
	ARRAY['id','scenario_id'] --ignored columns
);


select * from 
------------------------------------------------------------------------------------------
-- EVENT LOG (REFERENCED)
------------------------------------------------------------------------------------------
/*
--Diario referenziato di svolgimento delle azioni compiute in un evento
DROP TABLE IF EXISTS event_action_log CASCADE;
CREATE TABLE IF NOT EXISTS event_action_log (
	id BIGSERIAL PRIMARY KEY,
	event_action_id BIGINT NOT NULL REFERENCES event_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	status TEXT NOT NULL CHECK (status IN ('executable','non executable','running',
			'terminated (success)','terminated (not needed)','terminated (failed)')),
	annotation TEXT
);

--Diario referenziato delle annotazioni di un evento
DROP TABLE IF EXISTS event_annotation_log CASCADE;
CREATE TABLE IF NOT EXISTS event_annotation_log (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	annotation TEXT NOT NULL
);


------------------------------------------------------------------------------------------
-- EVENT LOG (STATIC)
------------------------------------------------------------------------------------------

--Diario statico di un evento (archivio)
DROP TABLE IF EXISTS event_static_log CASCADE;
CREATE TABLE IF NOT EXISTS event_static_log (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	ts TIMESTAMP NOT NULL,
	action_type TEXT NOT NULL CHECK (action_type IN ('action','annotation')),
	action_id BIGINT,
	action_name TEXT,
	action_description TEXT,
	action_value TEXT NOT NULL,
	annotation TEXT
);*/