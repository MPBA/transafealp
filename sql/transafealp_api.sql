--extension for pl/r language is needed
create extension if not exists plr;

--print a (not so pretty) scenario actions graph
DROP FUNCTION IF EXISTS graph_action (bigint,int,int) CASCADE;
CREATE OR REPLACE FUNCTION graph_action (scenario_id bigint,width int, height int)
RETURNS bytea AS
$BODY$
	require(RPostgreSQL)
	require(igraph)
	require(cairoDevice)
	require(RGtk2)

	pixmap <- gdkPixmapNew(w=width, h=height, depth=24)
	asCairoDevice(pixmap)

	query <- paste("select ap.name as parent,a.name as action from action_graph ag left join action a on a.id = ag.action_id left join action ap on ap.id = ag.parent_id where a.scenario_id = ",scenario_id,sep="")
	data <- dbGetQuery(conn, query)
	g <- plot(graph.edgelist(as.matrix(data)))
	print(g)
	
	plotPixbuf <- gdkPixbufGetFromDrawable(NULL, pixmap, pixmap$getColormap(), 0, 0, 0, 0, width, height)
	buffer <- gdkPixbufSaveToBufferv(plotPixbuf, 'png', character(0), character(0))$buffer
	dev.off()
	return(buffer)
$BODY$
LANGUAGE 'plr';

--Example of usage (function outputs a PNG file as a bytea)
/*select plr_set_display(':5.0'); --this is needed only if you run the query outside plr-utils.
select * from graph_action(
	1, --scenario id
	1000, --image width
	1000 --image height
);*/


--starts a new event for a given scenario
DROP FUNCTION IF EXISTS start_event (text,boolean,Geometry(Point,3035)) CASCADE;
CREATE OR REPLACE FUNCTION start_event (scenario_name text, is_real boolean, event_geom Geometry(Point,3035))
RETURNS event AS
$BODY$
DECLARE
	ev event;
	scen scenario;
BEGIN
	--let's create the new event!
	SELECT INTO scen * FROM scenario WHERE name = scenario_name;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Scenario not found!';
	END IF;
	ev.managing_authority_id = scen.managing_authority_id;
	ev.event_name = scen.name;
	ev.event_description = scen.description;
	ev.scenario_geom = scen.geom;
	
	SELECT INTO ev.category_name,ev.category_description,ev.subcategory_name,ev.subcategory_description
		c.name,c.description,sc.name,sc.description
		FROM scenario_subcategory sc LEFT JOIN scenario_category c ON sc.category_id = c.id
		WHERE sc.id = scen.subcategory_id;

	ev.id = nextval('event_id_seq');
	ev.is_real = is_real;
	ev.time_start = statement_timestamp();
	ev.status = 'open'::TEXT;
	ev.time_end = NULL;
	ev.event_geom = event_geom;

	INSERT INTO event VALUES (ev.*);

	--copy actions from the given scenario
	INSERT INTO ev_action (event_id,name,numcode,description,duration) 
		SELECT ev.id,name,numcode,description,duration FROM action WHERE scenario_id = scen.id;

	--copy visualizations
	INSERT INTO ev_visualization (action_id,description,type,resource,options)
		SELECT ea.id,v.description,v.type,v.resource,v.options FROM action a
			RIGHT JOIN visualization v ON a.id = v.action_id
			LEFT JOIN ev_action ea ON ea.name = a.name
			WHERE a.scenario_id = scen.id AND ea.event_id = ev.id;

	--copy action graph (recompute new ids)
	INSERT INTO ev_action_graph (action_id,parent_id,is_main_parent)
		SELECT ea.id action_id,eap.id parent_id,ag.is_main_parent FROM action_graph ag
		LEFT JOIN action a ON a.id = ag.action_id
		LEFT JOIN action ap ON ap.id = ag.parent_id
		LEFT JOIN ev_action ea ON ea.name = a.name
		LEFT JOIN ev_action eap ON eap.name = ap.name
		WHERE a.scenario_id = scen.id AND ap.scenario_id = scen.id
			AND eap.event_id = ev.id AND ea.event_id = ev.id;

	--copy actors
	INSERT INTO ev_actor (event_id,name,istitution,contact_info,email,phone)
		SELECT DISTINCT ev.id,ar.name,ar.istitution,ar.contact_info,ar.email,ar.phone FROM actor ar
		RIGHT JOIN action_m2m_actor m2m ON m2m.actor_id = ar.id
		LEFT JOIN action an ON an.id = m2m.action_id
		WHERE an.scenario_id = scen.id;

	--copy action_m2m_actor (recompute new ids)
	INSERT INTO ev_action_m2m_actor (action_id,actor_id)
		SELECT ea.id,ear.id FROM action_m2m_actor m2m
		LEFT JOIN action a ON a.id = m2m.action_id
		LEFT JOIN actor ar ON ar.id = m2m.actor_id
		LEFT JOIN ev_action ea ON ea.name = a.name
		LEFT JOIN ev_actor ear ON ear.email = ar.email
		WHERE a.scenario_id = scen.id AND ea.event_id = ev.id AND ear.event_id = ev.id;

	--mark root action as terminated
	UPDATE ev_action SET status = 'executable' WHERE event_id = ev.id AND name = 'root';
	UPDATE ev_action SET status = 'terminated (success)' WHERE event_id = ev.id AND name = 'root';
	
	ANALYZE ev_action;
	ANALYZE ev_visualization;
	ANALYZE ev_action_graph;
	ANALYZE ev_actor;
	ANALYZE ev_action_m2m_actor;
	ANALYZE event_log;

	RETURN ev;
END
$BODY$
LANGUAGE plpgsql;

--Example of usage
--select * from start_event('Frejus [SECT1/2/A]',false,'SRID=3035;POINT(0 0)');


--prints available action status (wraps around function used in trigger)
DROP FUNCTION IF EXISTS ev_action_next_status(BIGINT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION ev_action_next_status(event_id BIGINT, action_name TEXT,
	OUT available_statuses TEXT[], OUT reason TEXT) AS
$BODY$
DECLARE
	avs TEXT[];
	reas TEXT;
BEGIN
	SELECT INTO avs,reas * from ev_action_next_status(
		(SELECT id FROM ev_action ac WHERE ac.event_id = ev_action_next_status.event_id AND ac.name = action_name)
	);

	SELECT INTO available_statuses array(SELECT unnest(avs) EXCEPT SELECT 'non executable'::text);
	reason := reas;

	RETURN;
END
$BODY$
LANGUAGE plpgsql;

--Example of usage
--select * from ev_action_next_status(1,'root');
--select * from ev_action_next_status(1,'Fuffy');


--prints available action status (wraps around function used in trigger)
DROP FUNCTION IF EXISTS ev_action_next_status_gui(BIGINT) CASCADE;
CREATE OR REPLACE FUNCTION ev_action_next_status_gui(action_id BIGINT, OUT available_statuses TEXT[], OUT reason TEXT) AS
$BODY$
DECLARE
	avs TEXT[];
BEGIN
	SELECT INTO avs,reason * from ev_action_next_status(action_id);
	SELECT INTO available_statuses array(SELECT unnest(avs) EXCEPT SELECT 'non executable'::text);
	RETURN;
END
$BODY$
LANGUAGE plpgsql;


--compute fastest path on Alpcheck2 graph
DROP FUNCTION IF EXISTS path_fastest(TEXT,INTEGER,INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION path_fastest(interruptions_polygons_wtk TEXT, source_id INTEGER, target_id INTEGER)
RETURNS TEXT AS
$BODY$
	SELECT ST_AsGeoJSON(ST_Union(the_geom))
	FROM Shortest_path(
		'SELECT gid AS id, source, target, time AS cost, reverse_time AS reverse_cost
		FROM brenner WHERE NOT ST_Intersects (
			brenner.the_geom,
			(st_geomfromtext('||quote_literal(interruptions_polygons_wtk)||',4326))
		)',
		source_id,
		target_id,
		false,
		true
	) AS path, brenner AS topo WHERE path.edge_id=topo.gid;
$BODY$
LANGUAGE sql;

--Example of usage
/*select path_fastest(
	'MULTIPOLYGON(((10.233757787461212 47.26555808605963,10.442498021836581 47.83650801443217,11.178582006211556 47.577756399786665,10.89293747496162 47.116241319894,10.233757787461212 47.26555808605963)),((13.353874974961283 47.84388204579819,12.98033981871171 47.27301289785546,14.002068334336624 46.99648539191179,14.298699193711625 47.49616910757915,13.353874974961283 47.84388204579819)))',
	2111,
	5699
);*/

--compute shortest path on Alpcheck2 graph
DROP FUNCTION IF EXISTS path_shortest(TEXT,INTEGER,INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION path_shortest(interruptions_polygons_wtk TEXT, source_id INTEGER, target_id INTEGER)
RETURNS TEXT AS
$BODY$
	SELECT ST_AsGeoJSON(ST_Union(the_geom))
	FROM Shortest_path(
		'select gid AS id, source, target, cost, reverse_cost
		FROM brenner WHERE NOT ST_Intersects (
			brenner.the_geom,
			(st_geomfromtext('||quote_literal(interruptions_polygons_wtk)||',4326))
		)',
		source_id,
		target_id,
		false,
		true
	) AS path, brenner AS topo WHERE path.edge_id=topo.gid;
$BODY$
LANGUAGE sql;

--Example of usage
/*select path_shortest(
	'MULTIPOLYGON(((10.233757787461212 47.26555808605963,10.442498021836581 47.83650801443217,11.178582006211556 47.577756399786665,10.89293747496162 47.116241319894,10.233757787461212 47.26555808605963)),((13.353874974961283 47.84388204579819,12.98033981871171 47.27301289785546,14.002068334336624 46.99648539191179,14.298699193711625 47.49616910757915,13.353874974961283 47.84388204579819)))',
	2111,
	5699
);*/

--compute less vulnerable path on Alpcheck2 graph
DROP FUNCTION IF EXISTS path_vulnerability(TEXT,TEXT,INTEGER,INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION path_vulnerability(vulnerability TEXT, interruptions_polygons_wtk TEXT, source_id INTEGER, target_id INTEGER)
RETURNS TEXT AS
$BODY$
DECLARE
	col text;
	result text;
BEGIN
	CASE vulnerability
	    WHEN 'landslides' THEN
		col := 'nat01';
	    WHEN 'mudslides' THEN
		col := 'nat02';
	    WHEN 'floods' THEN
		col := 'nat03';
	    WHEN 'earthquakes' THEN
		col := 'nat04';
	    WHEN 'avalanches' THEN
		col := 'nat05';
	    WHEN 'forestfires' THEN
		col := 'nat06';
	    WHEN 'scree' THEN
		col := 'nat07';
	    ELSE
		RAISE EXCEPTION 'Wrong vulerability type';
	END CASE;

	SELECT INTO result ST_AsGeoJSON(ST_Union(the_geom))
	FROM Shortest_path(
		'select gid AS id, source, target, cost, reverse_cost
		FROM brenner WHERE '||quote_ident(col)||' = 0 AND NOT ST_Intersects (
			brenner.the_geom,
			(st_geomfromtext('||quote_literal(interruptions_polygons_wtk)||',4326))
		)',
		source_id,
		target_id,
		false,
		true
	) AS path, brenner AS topo WHERE path.edge_id=topo.gid;

	RETURN result;
END
$BODY$
LANGUAGE plpgsql;

--Example of usage
/*select path_vulnerability(
	'landslides',
	'MULTIPOLYGON(((10.233757787461212 47.26555808605963,10.442498021836581 47.83650801443217,11.178582006211556 47.577756399786665,10.89293747496162 47.116241319894,10.233757787461212 47.26555808605963)),((13.353874974961283 47.84388204579819,12.98033981871171 47.27301289785546,14.002068334336624 46.99648539191179,14.298699193711625 47.49616910757915,13.353874974961283 47.84388204579819)))',
	2111,
	5699
);*/


-- since pl/r is an untrusted language pl/r functions need superuser
-- permissions to be created. Later we assign grant to normal db user
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO transafe_dev;
GRANT ALL ON ALL TABLES IN SCHEMA public TO transafe_dev;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO transafe_dev;
 