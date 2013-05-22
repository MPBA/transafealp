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
select plr_set_display(':5.0'); --this is needed only if you run the query outside plr-utils.
select * from graph_action(
	1, --scenario id
	1000, --image width
	1000 --image height
);

-- since pl/r is an untrusted language pl/r functions need superuser
-- permissions to be created. Later we assign grant to normal db user
grant all on all functions in schema public to transafe_dev; 

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
	
	
	--copy all actions for the given scenario
	INSERT INTO ev_action (event_id,name,numcode,description,duration,status,comment)
		VALUES ((SELECT ev.id,name,numcode,description,duration FROM action WHERE scenario_id = scen.id));
	
	RETURN ev;
END
$BODY$
LANGUAGE plpgsql;

select * from start_event('Frejus [SECT1/2/A]',false,'SRID=3035;POINT(0 0)');
