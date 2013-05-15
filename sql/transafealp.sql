------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------
				-- TRANSAFEALP JITES DATABASE STRUCTURE --
------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------
-- USERS
------------------------------------------------------------------------------------------

/*--utente applicazione JITES
CREATE TABLE IF NOT EXISTS django_user (
	id BIGSERIAL PRIMARY KEY,
	username TEXT UNIQUE NOT NULL,
	passwd TEXT NOT NULL
);*/

--gestore della tratta di competenza
DROP TABLE IF EXISTS managing_authority CASCADE;
CREATE TABLE IF NOT EXISTS managing_authority (
	id BIGSERIAL PRIMARY KEY,
	auth_user_id BIGINT NOT NULL REFERENCES auth_user(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT UNIQUE NOT NULL,
	description TEXT NOT NULL,
	address TEXT NOT NULL,
	email TEXT NOT NULL,
	phone TEXT NOT NULL
);


------------------------------------------------------------------------------------------
-- ROAD SECTIONS IN ALPCHECK2
------------------------------------------------------------------------------------------

--alpcheck2 layer
DROP TABLE IF EXISTS alpcheck2 CASCADE;
CREATE TABLE alpcheck2
(
	gid SERIAL PRIMARY KEY,
	externalid numeric,
	cod_node_a numeric,
	cod_node_b numeric,
	oneway numeric,
	roadtype numeric,
	stateroadn character varying(50),
	streetname character varying(50),
	alpcheckco numeric,
	lanes numeric,
	capacity numeric,
	v0 numeric,
	vc numeric,
	lcf numeric,
	aadt_lv numeric,
	aadt_hv numeric,
	aadt_tot numeric,
	length numeric,
	lv_ab numeric,
	hv_ab numeric,
	dgtv_ab numeric,
	lv_ba numeric,
	hv_ba numeric,
	dgtv_ba numeric,
	the_geom geometry,
	source integer,
	target integer,
	cost double precision,
	available boolean NOT NULL DEFAULT true,
	id integer,
	"time" double precision,
	CONSTRAINT enforce_dims_the_geom CHECK (st_ndims(the_geom) = 2),
	CONSTRAINT enforce_geotype_the_geom CHECK (geometrytype(the_geom) = 'LINESTRING'::text OR the_geom IS NULL),
	CONSTRAINT enforce_srid_the_geom CHECK (st_srid(the_geom) = 4326)
);

--alpcheck2 interruptions for rerouting
DROP TABLE IF EXISTS interruptions CASCADE;
CREATE TABLE interruptions --original name: polygons
(
	gid SERIAL PRIMARY KEY,
	id integer,
	geom geometry
);


------------------------------------------------------------------------------------------
-- SCENARIOS, (SUB)ACTIONS AND OBJECTS/SUBJECTS
------------------------------------------------------------------------------------------

--categoria dello scenario
DROP TABLE IF EXISTS scenario_category CASCADE;
CREATE TABLE IF NOT EXISTS scenario_category (
	id BIGSERIAL PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	description TEXT NOT NULL
);

--sotto categoria dello scenario
DROP TABLE IF EXISTS scenario_subcategory CASCADE;
CREATE TABLE IF NOT EXISTS scenario_subcategory (
	id BIGSERIAL PRIMARY KEY,
	category_id BIGINT NOT NULL REFERENCES scenario_category(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT UNIQUE NOT NULL,
	description TEXT NOT NULL
);

--possibile scenario di azione per una tratta di competenza
DROP TABLE IF EXISTS scenario CASCADE;
CREATE TABLE IF NOT EXISTS scenario (
	id BIGSERIAL PRIMARY KEY,
	managing_authority_id BIGINT NOT NULL REFERENCES managing_authority(id) ON UPDATE CASCADE ON DELETE CASCADE,
	subcategory_id BIGINT REFERENCES scenario_subcategory(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT UNIQUE NOT NULL,
	description TEXT NOT NULL,
	geom geometry
);

DROP FUNCTION IF EXISTS new_scenario() CASCADE;
CREATE OR REPLACE FUNCTION new_scenario() RETURNS TRIGGER AS
$BODY$
BEGIN
	INSERT INTO action VALUES (DEFAULT, NEW.id, 'root', 0, 'start action for scenario '||NEW.name, 0);
	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION new_scenario() IS '';
DROP TRIGGER IF EXISTS new_scenario ON scenario CASCADE;
CREATE TRIGGER new_scenario AFTER INSERT ON scenario FOR EACH ROW EXECUTE PROCEDURE new_scenario();

/*insert into scenario values (default, 1, 1, 'scenario', 'descrizione', NULL);*/

------------------------------------------------------------------------------------------
-- ACTIONS AND OBJECTS/SUBJECTS
------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------
--azioni comprese in una fase
DROP TABLE IF EXISTS action CASCADE;
CREATE TABLE IF NOT EXISTS action (
	id BIGSERIAL PRIMARY KEY,
	scenario_id BIGINT NOT NULL REFERENCES scenario(id) ON UPDATE CASCADE ON DELETE CASCADE,
	name TEXT NOT NULL,
	numcode INTEGER NOT NULL DEFAULT 0,
	description TEXT NOT NULL,
	duration INTEGER NOT NULL DEFAULT 15 CHECK ((duration >= 0) AND (duration%15 = 0)),
	UNIQUE(scenario_id,name)
);

--trigger after insert
DROP FUNCTION IF EXISTS new_action() CASCADE;
CREATE OR REPLACE FUNCTION new_action() RETURNS TRIGGER AS
$BODY$
DECLARE
	parent_id bigint;
BEGIN
	IF (NEW.name = 'root') THEN
		RETURN NEW;
	END IF;

	IF (NEW.duration = 0) THEN
		RAISE WARNING 'Action duration cannot be 0 (set default 15)';
		NEW.duration = 15;
	END IF;

	SELECT INTO parent_id id FROM action WHERE name = 'root' AND scenario_id = NEW.scenario_id;
	INSERT INTO action_graph VALUES (DEFAULT,NEW.id,parent_id,TRUE);

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION new_action() IS '';
DROP TRIGGER IF EXISTS new_action_check ON action CASCADE;
CREATE TRIGGER new_action_check AFTER INSERT ON action
	FOR EACH ROW EXECUTE PROCEDURE new_action();

--trigger on update
DROP FUNCTION IF EXISTS update_action() CASCADE;
CREATE OR REPLACE FUNCTION update_action() RETURNS TRIGGER AS
$BODY$
DECLARE
	parent_id bigint;
BEGIN
	IF (OLD.name = 'root') THEN
		RAISE WARNING 'root elments are not editable.';
		RETURN OLD;
	END IF;

	IF (NEW.duration = 0) THEN
		RAISE WARNING 'Action duration cannot be 0 (set default 15)';
		NEW.duration = 15;
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION update_action() IS '';
DROP TRIGGER IF EXISTS update_action ON action CASCADE;
CREATE TRIGGER update_action BEFORE UPDATE ON action
	FOR EACH ROW EXECUTE PROCEDURE update_action();

------------------------------------------------------------------------------------------

--grafo delle azioni
DROP TABLE IF EXISTS action_graph CASCADE;
CREATE TABLE IF NOT EXISTS action_graph (
	id BIGSERIAL PRIMARY KEY,
	action_id BIGINT NOT NULL REFERENCES action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	parent_id BIGINT NOT NULL REFERENCES action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	is_main_parent BOOLEAN NOT NULL DEFAULT TRUE,
	CHECK (action_id != parent_id),
	UNIQUE (action_id, parent_id)
);

--trigger to disable graph updates on table. Delete and insert command should be used instead.
DROP FUNCTION IF EXISTS update_action_graph() CASCADE;
CREATE OR REPLACE FUNCTION update_action_graph() RETURNS TRIGGER AS
$BODY$
BEGIN
	IF (OLD.action_id != NEW.action_id OR OLD.parent_id != NEW.parent_id OR OLD.id != NEW.id) THEN
		RAISE EXCEPTION 'Action graph cannot be updated. Please delete and insert instead. No changes were made.';
	END IF;

	IF (OLD.is_main_parent = TRUE AND NEW.is_main_parent = FALSE
		AND ((SELECT count(id) FROM action_graph WHERE action_id = NEW.action_id AND is_main_parent = TRUE)=1)
	) THEN
		NEW.is_main_parent = TRUE;
		RAISE WARNING 'An action needs at least one main parent. Set a new main parent instead. No changes were made.';
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION update_action_graph() IS '';
DROP TRIGGER IF EXISTS update_action_graph ON action_graph CASCADE;
CREATE TRIGGER update_action_graph BEFORE UPDATE ON action_graph
	FOR EACH ROW EXECUTE PROCEDURE update_action_graph();

--updates on is_main_parent propriety are allowed (checked to be consistent)
DROP FUNCTION IF EXISTS update_action_graph_after() CASCADE;
CREATE OR REPLACE FUNCTION update_action_graph_after() RETURNS TRIGGER AS
$BODY$
BEGIN
	IF (/*OLD.is_main_parent = FALSE AND */NEW.is_main_parent = TRUE) THEN
		UPDATE action_graph SET is_main_parent = FALSE
			WHERE action_id = NEW.action_id AND is_main_parent = TRUE AND parent_id != NEW.parent_id;
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION update_action_graph_after() IS '';
DROP TRIGGER IF EXISTS update_action_graph_after ON action_graph CASCADE;
CREATE TRIGGER update_action_graph_after AFTER UPDATE ON action_graph
	FOR EACH ROW EXECUTE PROCEDURE update_action_graph_after();

insert into action_graph (parent_id,action_id) values (63,62);
delete from action_graph where id = 87;

-- private func --
DROP FUNCTION IF EXISTS find_descendants (bigint) CASCADE;
CREATE OR REPLACE FUNCTION find_descendants (action_id bigint)
RETURNS TABLE (action bigint) AS
$BODY$
BEGIN
	PERFORM id FROM action WHERE id = action_id;
	IF NOT FOUND THEN
		RAISE WARNING 'Action % not found.',action_id;
		RETURN;
	END IF;

	RETURN QUERY WITH RECURSIVE childtree(elem) AS (
		(SELECT ag.action_id FROM action_graph ag WHERE parent_id = $1)
		UNION
		(SELECT ag.action_id FROM action_graph ag,childtree
		 WHERE ag.parent_id = childtree.elem)
	)
	SELECT elem FROM childtree;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION find_descendants (bigint) IS 'TODO';

-- private func --
DROP FUNCTION IF EXISTS find_ancestors (bigint) CASCADE;
CREATE OR REPLACE FUNCTION find_ancestors (action_id bigint)
RETURNS TABLE (action bigint) AS
$BODY$
BEGIN
	PERFORM id FROM action WHERE id = action_id;
	IF NOT FOUND THEN
		RAISE WARNING 'Action % not found.',action_id;
		RETURN;
	END IF;

	RETURN QUERY WITH RECURSIVE ancestors(elem) AS (
		(SELECT ag.parent_id FROM action_graph ag WHERE ag.action_id = $1)
		UNION
		(SELECT ag.parent_id FROM action_graph ag,ancestors
		 WHERE ag.action_id = ancestors.elem)
	)
	SELECT elem FROM ancestors;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION find_ancestors (bigint) IS 'TODO';

--lists suitable parents for an action
DROP FUNCTION IF EXISTS find_available_parents (bigint) CASCADE;
CREATE OR REPLACE FUNCTION find_available_parents (action_id bigint)
RETURNS TABLE (action bigint) AS
$BODY$
DECLARE
	scen_id bigint;
BEGIN
	SELECT INTO scen_id a.scenario_id FROM action a WHERE a.id = action_id;
	IF NOT FOUND THEN
		RAISE WARNING 'Action % not found.',action_id;
		RETURN;
	END IF;

	RETURN QUERY SELECT id FROM action a WHERE a.scenario_id = scen_id AND a.id NOT IN
	(
		(SELECT action_id)
		UNION
		(SELECT * FROM find_ancestors(action_id))
		UNION
		(SELECT * FROM find_descendants(action_id))
	);
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION find_available_parents (bigint) IS 'TODO';

--finds root element for an action
DROP FUNCTION IF EXISTS find_root (bigint) CASCADE;
CREATE OR REPLACE FUNCTION find_root (action_id bigint, OUT root_id bigint, OUT scenario_id bigint)
AS
$BODY$
	SELECT id,scenario_id FROM action WHERE name = 'root'
		AND scenario_id = (SELECT scenario_id FROM action WHERE id = action_id);
$BODY$
LANGUAGE sql;
COMMENT ON FUNCTION find_root (bigint) IS 'TODO';

--trigger on insert
DROP FUNCTION IF EXISTS new_action_graph() CASCADE;
CREATE OR REPLACE FUNCTION new_action_graph() RETURNS TRIGGER AS
$BODY$
BEGIN
	IF (NEW.parent_id NOT IN (SELECT * FROM find_available_parents(NEW.action_id))) THEN
		RAISE EXCEPTION 'Action % is not a valid parent for action %',NEW.parent_id,NEW.action_id;
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION new_action_graph() IS '';
DROP TRIGGER IF EXISTS new_action_graph ON action_graph CASCADE;
CREATE TRIGGER new_action_graph BEFORE INSERT ON action_graph
	FOR EACH ROW EXECUTE PROCEDURE new_action_graph();

--trigger after insert
DROP FUNCTION IF EXISTS after_new_action_graph() CASCADE;
CREATE OR REPLACE FUNCTION after_new_action_graph() RETURNS TRIGGER AS
$BODY$
DECLARE
	par_id bigint;
BEGIN
	--remove redundant links
	FOR par_id IN SELECT x.par FROM (
		SELECT DISTINCT parent_id par,find_descendants(parent_id) des
		FROM action_graph WHERE action_id = NEW.action_id
	) x WHERE des = NEW.parent_id
	LOOP
		DELETE FROM action_graph WHERE action_id = NEW.action_id AND parent_id = par_id;
		RAISE WARNING 'Redundant link between parent action % and % was removed',par_id,NEW.action_id;
	END LOOP;

	IF (NEW.is_main_parent) THEN --hey! this new link sould be main parent, let's trigger old main parents removal
		UPDATE action_graph SET is_main_parent = TRUE WHERE id = NEW.id;
	END IF;

	--set new main parent if old one has been removed
	/*PERFORM id FROM action_graph WHERE action_id = NEW.action_id AND is_main_parent = TRUE;
	IF NOT FOUND THEN
		UPDATE action_graph SET is_main_parent = TRUE
			WHERE action_id = NEW.action_id AND parent_id = NEW.parent_id;
	END IF;*/

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION after_new_action_graph() IS '';
DROP TRIGGER IF EXISTS after_new_action_graph ON action_graph CASCADE;
CREATE TRIGGER after_new_action_graph AFTER INSERT ON action_graph
	FOR EACH ROW EXECUTE PROCEDURE after_new_action_graph();

--trigger after delte
DROP FUNCTION IF EXISTS after_delete_action_graph() CASCADE;
CREATE OR REPLACE FUNCTION after_delete_action_graph() RETURNS TRIGGER AS
$BODY$
DECLARE
	ag_id bigint;
BEGIN
	--if action has just been deleted just return, let it go.
	PERFORM id FROM action WHERE id = OLD.action_id;
	IF NOT FOUND THEN
		RETURN OLD;
	END IF;

	--action is still present, if it's orphan re-link it to root.
	SELECT INTO ag_id id FROM action_graph WHERE action_id = OLD.action_id LIMIT 1;
	IF NOT FOUND THEN
		INSERT INTO action_graph (action_id,parent_id)
			VALUES (OLD.action_id, (find_root(OLD.action_id)).root_id);
		RAISE NOTICE 'No parent present, action relinked to root';
	ELSIF (OLD.is_main_parent = TRUE) THEN --hey! we just delted the main parent, we need to set a new one!
		UPDATE action_graph SET is_main_parent = TRUE WHERE id = ag_id;
		RAISE NOTICE 'Main parent has been deleted, setting a new one.';
	END IF;

	RETURN OLD;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION after_delete_action_graph() IS '';
DROP TRIGGER IF EXISTS after_delete_action_graph ON action_graph CASCADE;
CREATE TRIGGER after_delete_action_graph AFTER DELETE ON action_graph
	FOR EACH ROW EXECUTE PROCEDURE after_delete_action_graph();

------------------------------------------------------------------------------------------

--attori delle azioni
DROP TABLE IF EXISTS actor CASCADE;
CREATE TABLE IF NOT EXISTS actor (
	id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	istitution TEXT NOT NULL,
	contact_info TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	phone TEXT NOT NULL
);

--attori associati alle azioni
DROP TABLE IF EXISTS action_m2m_actor CASCADE;
CREATE TABLE IF NOT EXISTS action_m2m_actor (
	id BIGSERIAL PRIMARY KEY,
	action_id BIGINT NOT NULL REFERENCES action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	actor_id BIGINT NOT NULL REFERENCES actor(id) ON UPDATE CASCADE ON DELETE CASCADE,
	UNIQUE (action_id, actor_id)
);

--visualizzazioni che il JITES deve mostrare quando una azione viene selezionata
DROP TABLE IF EXISTS visualization CASCADE;
CREATE TABLE IF NOT EXISTS visualization (
	id BIGSERIAL PRIMARY KEY,
	action_id BIGINT NOT NULL REFERENCES action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	description TEXT,
	type TEXT NOT NULL,
	content TEXT NOT NULL
);

------------------------------------------------------------------------------------------
-- EVENT (LIVE STATUS)
------------------------------------------------------------------------------------------

--Scenario di Evento/emergenza aperto dal gestore della tratta
DROP TABLE IF EXISTS event CASCADE;
CREATE TABLE IF NOT EXISTS event (
	id BIGSERIAL PRIMARY KEY,
	scenario_id BIGINT NOT NULL REFERENCES scenario(id) ON UPDATE CASCADE ON DELETE CASCADE,
	status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
	is_real BOOLEAN NOT NULL DEFAULT FALSE,
	time_start TIMESTAMP,
	time_end TIMESTAMP,
	geom geometry NOT NULL CHECK (st_ndims(geom) = 2 AND st_srid(geom) = 3035 AND geometrytype(geom) = 'MULTIPOLYGON'::text)
);

--Stato delle azioni di un evento
DROP TABLE IF EXISTS event_action CASCADE;
CREATE TABLE IF NOT EXISTS event_action (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	action_id BIGINT NOT NULL REFERENCES action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','falied','unneeded'))
);

------------------------------------------------------------------------------------------
-- EVENT LOG (REFERENCED)
------------------------------------------------------------------------------------------

--Diario referenziato di svolgimento delle azioni compiute in un evento
DROP TABLE IF EXISTS event_action_log CASCADE;
CREATE TABLE IF NOT EXISTS event_action_log (
	id BIGSERIAL PRIMARY KEY,
	event_action_id BIGINT NOT NULL REFERENCES event_action(id) ON UPDATE CASCADE ON DELETE CASCADE,
	ts TIMESTAMP NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('pending','running','done','falied','unneeded')),
	annotation TEXT
);

--Diario referenziato delle annotazioni di un evento
DROP TABLE IF EXISTS event_annotation_log CASCADE;
CREATE TABLE IF NOT EXISTS event_annotation_log (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE,
	ts TIMESTAMP NOT NULL,
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
);

DROP FUNCTION IF EXISTS get_actions (bigint) CASCADE;
CREATE OR REPLACE FUNCTION get_actions (action_id bigint) RETURNS SETOF action
AS
$BODY$
	SELECT * FROM action WHERE ;
$BODY$
LANGUAGE sql;
COMMENT ON FUNCTION get_actions (bigint) IS 'TODO';