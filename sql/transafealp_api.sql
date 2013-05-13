--extension for pl/r language is needed
create extension if not exists plr;

--print a (not so pretty) scenario actions graph
DROP FUNCTION IF EXISTS graph_action (bigint,int,int);
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
