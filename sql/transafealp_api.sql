create extension if not exists plr;
grant all on all functions in schema public to transafe_dev;

--calcolo quantili
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

	#conn <- dbConnect(PostgreSQL(), host = "geopg", dbname = "transafe_dev", user= "transafe_dev", pass="transafe2K13alp!!")
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

select plr_set_display(':5.0');
select * from graph_action(
	1,
	1000,
	1000
);

grant all on all functions in schema public to transafe_dev;