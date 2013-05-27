------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------
				-- CORE TABLES AND TRIGGERS --
------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
SET client_min_messages TO NOTICE;

------------------------------------------------------------------------------------------
-- PREREQUSITES (USEFUL FUNCS)
------------------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS gt_select (text) CASCADE;
CREATE OR REPLACE FUNCTION gt_select (query_text text)
RETURNS SETOF record AS
$BODY$
BEGIN
	RETURN QUERY EXECUTE query_text;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION gt_select (text)
	IS 'Executes a select (returns a recordset)';

--- LISTS COLUMNS IN A TABLE
DROP FUNCTION IF EXISTS gt_get_table_columns (name,name) CASCADE;
CREATE OR REPLACE FUNCTION gt_get_table_columns (tableschema name, tablename name)
RETURNS TABLE(column_name name, data_type varchar,is_nullable boolean) AS
$BODY$
DECLARE
	query_text text;
	udt_name varchar;
BEGIN
	query_text := 'SELECT column_name,data_type,is_nullable::boolean,udt_name
			FROM information_schema.columns
			WHERE table_schema = '||quote_literal($1)||' AND table_name = '||quote_literal($2)
			|| ' ORDER BY ordinal_position';

	FOR column_name,data_type,is_nullable,udt_name IN EXECUTE query_text
	LOOP
		IF data_type = 'USER-DEFINED' THEN
			data_type := udt_name;
		END IF;
		RETURN NEXT;
	END LOOP;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Table % not found in schema %',tablename,tableschema;
	END IF;
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION gt_get_table_columns (name,name)
	IS 'TODO';
------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------
-- CATALOG
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS gt_catalog CASCADE;
CREATE TABLE IF NOT EXISTS gt_catalog (
	id BIGSERIAL NOT NULL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	creation_time timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	numcode INTEGER NOT NULL DEFAULT 0,
	tabletype text NOT NULL DEFAULT 'local' CHECK (tabletype IN ('local', 'pgsql', 'csv', 'multicorn')),
	tableschema name,
	tablename name,
	code_column name,
	time_column name
);

CREATE OR REPLACE FUNCTION gt_catalog_noedit() RETURNS TRIGGER AS
$BODY$
DECLARE
	reln name;
BEGIN
	SELECT INTO reln p.relname FROM pg_class p WHERE TG_RELID = p.oid;

	IF (reln = 'gt_catalog') THEN
		RAISE EXCEPTION 'Cannot insert or edit gt_catalog directly!';
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS gt_catalog_noedit_check ON gt_catalog CASCADE;
CREATE TRIGGER gt_catalog_noedit_check BEFORE INSERT OR UPDATE OR DELETE ON gt_catalog
	EXECUTE PROCEDURE gt_catalog_noedit();
------------------------------------------------------------------------------------------

------------------------------------------------------------------------------------------
-- LAYER STYLE
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS gt_style CASCADE;
CREATE TABLE IF NOT EXISTS gt_style (
	id BIGSERIAL NOT NULL PRIMARY KEY,
	name varchar(255) UNIQUE NOT NULL,
	label varchar(255) NOT NULL,
	xml xml,
	feature_type text
);

---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX>-LAYER-<XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---
------------------------------------------------------------------------------------------
-- CATALOG LAYER GROUP
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS gt_layer_group CASCADE;
CREATE TABLE IF NOT EXISTS gt_layer_group (
	id BIGSERIAL PRIMARY KEY,
	--id BIGINT PRIMARY KEY,
	name VARCHAR(255) NOT NULL
);
INSERT INTO gt_layer_group VALUES (0,'root');
INSERT INTO gt_layer_group VALUES (1,'temp');
------------------------------------------------------------------------------------------
-- CATALOG LAYER (triggers are below)
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS gt_catalog_layer CASCADE;
CREATE TABLE IF NOT EXISTS gt_catalog_layer (
	id BIGINT NOT NULL UNIQUE,
	group_id BIGINT NOT NULL DEFAULT 0 REFERENCES gt_layer_group(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	gt_style_id BIGINT DEFAULT NULL REFERENCES gt_style(id)
		ON UPDATE CASCADE ON DELETE NO ACTION,
	geom_column name,
	ui_qtip VARCHAR(255),
	gs_name VARCHAR(255) NOT NULL,
	gs_workspace VARCHAR(255),
	gs_url VARCHAR(255) NOT NULL,
	gs_legend_url VARCHAR(255),
	UNIQUE (tableschema,tablename,code_column,geom_column),
	CONSTRAINT set_all_table_fields CHECK
	((tableschema is null = tablename is null AND tablename is null = geom_column is null) OR
	(tableschema is not null AND tablename is not null AND geom_column is null))
) INHERITS (gt_catalog);
------------------------------------------------------------------------------------------
-- CATALOG LAYER GROUP TREE (triggers are below)
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS gt_layer_tree CASCADE;
CREATE TABLE IF NOT EXISTS gt_layer_tree (
	id BIGSERIAL PRIMARY KEY,
	group_id BIGINT NOT NULL UNIQUE REFERENCES gt_layer_group(id) ON UPDATE CASCADE ON DELETE CASCADE,
	parent_group_id BIGINT NOT NULL REFERENCES gt_layer_group(id) ON UPDATE CASCADE ON DELETE CASCADE
);
insert into gt_layer_tree values (0,0,0);
insert into gt_layer_tree values (1,1,0);
------------------------------------------------------------------------------------------
-- CATALOG LAYER METADATA
------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS gt_layer_meta CASCADE;
CREATE TABLE IF NOT EXISTS gt_layer_meta (
	id BIGSERIAL PRIMARY KEY,
	layer_id BIGINT UNIQUE NOT NULL REFERENCES gt_catalog_layer(id)
		ON UPDATE CASCADE ON DELETE CASCADE,
	title varchar(255),
	description TEXT,
	category TEXT,
	extent TEXT,
	measure_unit TEXT,
	author TEXT,
	ref_year INTEGER,
	creation_year INTEGER,
	native_format TEXT,
	genealogy TEXT,
	spatial_resolution TEXT,
	ref_system TEXT,
	availability TEXT,
	has_attributes BOOLEAN,
	source TEXT
);
---XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX---

------------------------------------------------------------------------------------------
-- CATALOG * TREE TRIGGERS
------------------------------------------------------------------------------------------
-- private func --
DROP FUNCTION IF EXISTS _gt_group_find_subtree (bigint,name) CASCADE;
CREATE OR REPLACE FUNCTION _gt_group_find_subtree (group_id bigint, catalog_tree_table name)
RETURNS TABLE (id bigint) AS
$BODY$
BEGIN
	RETURN QUERY EXECUTE 'WITH RECURSIVE subtree(elem) AS (
		(SELECT group_id FROM '||quote_ident($2)||' WHERE parent_group_id = '||$1||')
		UNION
		(SELECT group_id FROM '||quote_ident($2)||',subtree
		 WHERE '||quote_ident($2)||'.parent_group_id = subtree.elem)
	)
	SELECT elem FROM subtree';
END
$BODY$
LANGUAGE plpgsql;
COMMENT ON FUNCTION _gt_group_find_subtree (bigint,name) IS 'TODO';

CREATE OR REPLACE FUNCTION gt_group_tree_check() RETURNS TRIGGER AS
$BODY$
BEGIN
	IF (TG_OP = 'UPDATE' AND OLD.group_id < 2) THEN
		RAISE EXCEPTION 'Cannot modify root elements';
	END IF;

	IF (NEW.parent_group_id NOT IN
		(SELECT gid FROM gt_select('SELECT group_id FROM '||TG_TABLE_NAME) AS (gid bigint))
	) THEN
		RAISE EXCEPTION 'Parent not present in tree.';
	END IF;

	IF (NEW.group_id IN (SELECT * FROM _gt_group_find_subtree(NEW.group_id,TG_TABLE_NAME))) THEN
		RAISE EXCEPTION 'Cannot set a descendant as parent.';
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;

--gt_layer_tree
DROP TRIGGER IF EXISTS gt_layer_tree_after_check ON gt_layer_tree CASCADE;
CREATE TRIGGER gt_layer_tree_after_check AFTER INSERT OR UPDATE ON gt_layer_tree
	FOR EACH ROW EXECUTE PROCEDURE gt_group_tree_check();
------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------
-- CATALOG * TRIGGERS
------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gt_catalog_layer_after_insert_check() RETURNS TRIGGER AS
$BODY$
DECLARE
	colname name;
	datatype varchar;
	codefound boolean = false;
	datafound boolean = false;
BEGIN
	IF NEW.geom_column IS NOT NULL THEN
		IF (NEW.geom_column,'geometry'::varchar) NOT IN
		(SELECT column_name, data_type FROM gt_get_table_columns(NEW.tableschema,NEW.tablename)) THEN
			RAISE EXCEPTION 'column ''%'' with type ''geometry'' not found in table ''%.%''',
				NEW.geom_column,NEW.tableschema,NEW.tablename;
		END IF;
	END IF;

	IF NEW.code_column IS NOT NULL THEN
		IF (NEW.code_column,'character varying'::varchar) NOT IN
		(SELECT column_name, data_type FROM gt_get_table_columns(NEW.tableschema,NEW.tablename)) THEN
			RAISE EXCEPTION 'column ''%'' with type ''character varying'' not found in table ''%.%''',
				NEW.code_column,NEW.tableschema,NEW.tablename;
		END IF;
	END IF;

	RETURN NEW;
END
$BODY$
LANGUAGE plpgsql;

--gt_catalog_layer
DROP TRIGGER IF EXISTS gt_catalog_layer_after_check ON gt_catalog_layer CASCADE;
CREATE TRIGGER gt_catalog_layer_after_check AFTER INSERT ON gt_catalog_layer
	FOR EACH ROW EXECUTE PROCEDURE gt_catalog_layer_after_insert_check();
------------------------------------------------------------------------------------------

