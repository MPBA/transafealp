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
		RAISE EXCEPTION 'Action duration cannot be 0';
	END IF;

	IF (TG_OP = 'INSERT') THEN
		SELECT INTO parent_id id FROM action WHERE name = 'root' AND scenario_id = NEW.scenario_id;
		INSERT INTO action_graph VALUES (DEFAULT,NEW.id,parent_id,TRUE);
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION new_action() IS '';
DROP TRIGGER IF EXISTS new_action_check ON action CASCADE;
CREATE TRIGGER new_action_check AFTER INSERT OR UPDATE ON action FOR EACH ROW EXECUTE PROCEDURE new_action();

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

-- private func --
DROP FUNCTION IF EXISTS find_descendants (bigint) CASCADE;
CREATE OR REPLACE FUNCTION find_descendants (action_id bigint)
RETURNS TABLE (action bigint) AS
$BODY$
BEGIN
	PERFORM id FROM action WHERE id = action_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Action not found.';
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
		RAISE EXCEPTION 'Action not found.';
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

DROP FUNCTION IF EXISTS find_available_parents (bigint) CASCADE;
CREATE OR REPLACE FUNCTION find_available_parents (action_id bigint)
RETURNS TABLE (action bigint) AS
$BODY$
DECLARE
	scen_id bigint;
BEGIN
	SELECT INTO scen_id a.scenario_id FROM action a WHERE a.id = action_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Action not found.';
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

DROP FUNCTION IF EXISTS new_action_graph() CASCADE;
CREATE OR REPLACE FUNCTION new_action_graph() RETURNS TRIGGER AS
$BODY$
DECLARE
	parent_id bigint;
BEGIN
	IF (NEW.parent_id NOT IN (SELECT * FROM find_available_parents(NEW.action_id))) THEN
		RAISE EXCEPTION 'Cannot set action % as parent for action %',NEW.parent_id,NEW.action_id;
	END IF;

	--Is the parent troublesome? check if we need to delete some redundant links
	IF (NEW.parent_id IN (SELECT DISTINCT find_descendants(parent_id)
		FROM action_graph WHERE action_id = NEW.action_id)
	) THEN
		
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION new_action_graph() IS '';
DROP TRIGGER IF EXISTS new_action_graph ON action_graph CASCADE;
CREATE TRIGGER new_action_graph BEFORE INSERT OR UPDATE ON action_graph
	FOR EACH ROW EXECUTE PROCEDURE new_action_graph();

select DISTINCT x.parent_id FROM (
SELECT DISTINCT parent_id,find_descendants(parent_id) FROM action_graph WHERE action_id = 8
) x

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