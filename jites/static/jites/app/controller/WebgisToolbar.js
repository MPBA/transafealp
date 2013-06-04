/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/30/13
 * Time: 12:39 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.controller.WebgisToolbar', {
    extend: 'Ext.app.Controller',

    views: [
        'toolbar.ToolbarPanel',
        'toolbar.DragPan',
        'toolbar.ZoomIn',
        'toolbar.ZoomOut',
        'toolbar.ZoomMaxExtent',
        'toolbar.NavPrevious',
        'toolbar.NavNext',
        'toolbar.GetMousePosition',
        'toolbar.GetLocation',
        'toolbar.GetFeatureInfo'
    ],

    refs: [
        {
            ref: 'toolbar',
            selector: 'toolbarpanel'
        }
    ],

    init: function() {
        this.control({
            '#webgiscenter': {
                afterlayout:{
                    fn: this.onPanelRendered,
                    scope: this,
                    single: true
                }
            },
            'dragpan':{
                'toggle': {
                    fn: this.onClick,
                    scope: this
                }
            },
            'zoomin':{
                'toggle': {
                    fn: this.onClick,
                    scope: this
                }
            },
            'zoomout':{
                'toggle': {
                    fn: this.onClick,
                    scope: this
                }
            },
            'zoomextent':{
                'click': {
                    fn: this.onZoomToMaxExtent,
                    scope: this
                }
            },
            'navprevious':{
                'click': {
                    fn: this.onNavigation,
                    scope: this
                }
            },
            'navnext':{
                'click': {
                    fn: this.onNavigation,
                    scope: this
                }
            },
//            'getmouseposition':{
//                'toggle': {
//                    fn: this.onGetMousePosition,
//                    scope: this
//                }
//            },
//            'getfeatureinfo':{
//                'toggle': {
//                    fn: this.onGetFeatureInfo,
//                    scope: this
//                }
//            },
            'getlocation':{
                'toggle': {
                    fn: this.onGetLocation,
                    scope: this
                }
            }
        });
    },
    onPanelRendered: function(){

        var dragPan = new Jites.view.toolbar.DragPan({
            olMap: Jites.maps[0]
        });
        var zoomIn = new Jites.view.toolbar.ZoomIn({
            olMap: Jites.maps[0]
        });
        var zoomOut = new Jites.view.toolbar.ZoomOut({
            olMap: Jites.maps[0]
        });
        var zoomMax = new Jites.view.toolbar.ZoomMaxExtent({
            olMap: Jites.maps[0]
        });
//        var getMouse = new Jites.view.toolbar.GetMousePosition({
//            olMap: Jites.maps[0],
//            fn: this.updateInfoPanel
//        });
//        var getFeatureInfo = new Jites.view.toolbar.GetFeatureInfo({
//            olMap: Jites.maps[0],
//            fn: this.updateGetFeatureInfoPanel
//        });
        var getLocation = new Jites.view.toolbar.GetLocation({
            olMap: Jites.maps[0],
            updateLocation: this.onGetLocationUpdate,
            updateLocationError: this.onGetLocationUpdateError
        });

        nav = new OpenLayers.Control.NavigationHistory({
            limit: 10
        });
        Jites.maps[0].addControl(nav);
        Jites.maps[0].addControl(nav.previous);
        Jites.maps[0].addControl(nav.next);
        var navPrevious = new Jites.view.toolbar.NavPrevious({
            olMap: Jites.maps[0],
            action: "previous",
            control: nav
        });
        var navNext = new Jites.view.toolbar.NavNext({
            olMap: Jites.maps[0],
            action: "next",
            control: nav
        });

        var tb = new Jites.view.toolbar.ToolbarPanel({
            items: [
                dragPan,
                zoomIn,
                zoomOut,
                zoomMax,
                navPrevious,
                navNext,
//                getMouse
                getLocation
//                getFeatureInfo
            ]
        });

        //Set toolbar visibility according to webgisarea visibilty in single mode
        if (Jites.DISPLAYMODE == 'single'){
            var i = Ext.getCmp("interface");

            i.on({
                tabchange:{
                    fn: this.setToolbarVisibility,
                    scope: this
                }
            });
        }

    },
    onClick: function(btn,pressed){
        if(pressed){
            btn.control.activate();
        } else {
            btn.control.deactivate();
        }
    },
    onZoomToMaxExtent: function(btn){
        btn.control.trigger();
    },
    onNavigation: function(btn){
        //TODO: Implementare controllo se esistono operazioni previous/next da fare
        if(btn.action=="previous"){
            btn.control.previousTrigger();
        } else {
            btn.control.nextTrigger();
        }
    },
    onGetMousePosition: function(btn,pressed) {
        if (pressed) {
            var tbXY = this.getToolbar().getPosition()
            btn.control.activate();
            btn.infopanel.setPosition(tbXY[0] + 5,tbXY[1] + this.getToolbar().getHeight());
            btn.infopanel.setVisible(true)

            //imposto marker layer
            btn.olMap.addLayer(btn.markerslayer);
        } else {
            btn.infopanel.setVisible(false);
            btn.olMap.removeLayer(btn.markerslayer);
            btn.control.deactivate();
        }

    },
    onGetFeatureInfo: function(btn,pressed) {
        if (pressed) {
            var tbXY = this.getToolbar().getPosition()
            btn.control.activate();
            btn.infopanel.setPosition(tbXY[0] + 5,tbXY[1] + this.getToolbar().getHeight());
            btn.infopanel.setVisible(true)

            //imposto marker layer
            btn.olMap.addLayer(btn.markerslayer);
        } else {
            btn.infopanel.setVisible(false);
            btn.olMap.removeLayer(btn.markerslayer);
            btn.control.deactivate();
        }
    },
    updateInfoPanel: function(e){
        var latlon = this.handlerOptions.ref.olMap.getLonLatFromPixel(e.xy);
        var latlon4326 = latlon.clone().transform("EPSG:32632","EPSG:4326");
        var result = {
            lat: latlon.lat,
            lon: latlon.lon,
            latPrj: latlon4326.lat,
            lonPrj: latlon4326.lon

        }
        this.handlerOptions.ref.markerslayer.addMarker(new OpenLayers.Marker(latlon, this.handlerOptions.ref.icon));

        var tpl = new Ext.Template(
            '<p>Your are clicked near: </p>',
            '<p>{lat}, {lon} - <a target="_blank" href="https://maps.google.it/maps?q={latPrj},+{lonPrj}&hl=it&sll=46.070807,11.127759&sspn=0.180307,0.445976&t=m&z=16">view in gmaps</a></p>'
        );
        tpl.overwrite(this.handlerOptions.ref.infopanel.id,result);
    },
    updateGetFeatureInfoPanel: function(e){
        var map = Jites.maps[0];
        var layers = map.getLayersBy('isIndicator',true);
        var layers_name = new Array();

        //Creao un array con i nomi di tutti i layer di tipo indicatore
        Ext.Array.each(layers,function(el){
            layers_name.push(el.params.LAYERS);
        });

        //WMS GetFeatureInfo params
        var params = {
            REQUEST: "GetFeatureInfo",
            VERSION: "1.1.1",
            EXCEPTIONS: "application/vnd.ogc.se_xml",
            BBOX: map.getExtent().toBBOX(),
            X:parseInt(e.xy.x),
            Y:parseInt(e.xy.y),
            SERVICE: "WMS",
            INFO_FORMAT: 'text/html',
            QUERY_LAYERS: layers_name.join(','),
            FEATURE_COUNT: 50,
            LAYERS: layers_name.join(','),
            STYLES: "polygon",
            WIDTH: map.size.w,
            HEIGHT: map.size.h
        };

        Ext.Ajax.request({
            url: layers[0].url, //Mi aspetto che la sorgente dei layer indicatori sia sempre la stessa per tutti
            params: params,
            method: 'GET',
            disableCachingParam: true,
            success: function(response, opts) {
                console.dir(response);
                var tpl = new Ext.Template(
                    '<div>',
                    '{responseText}',
                    '</div>'
                )
                tpl.overwrite(this.handlerOptions.ref.infopanel.id,response);
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
            }
        });

        var latlon = this.handlerOptions.ref.olMap.getLonLatFromPixel(e.xy);
        this.handlerOptions.ref.markerslayer.addMarker(new OpenLayers.Marker(latlon, this.handlerOptions.ref.icon));

    },
    onGetLocation: function(btn,pressed){
        if (pressed) {
            btn.olMap.addLayer(btn.vectorlayer);
            btn.control.activate();
        } else {
            btn.olMap.removeLayer(btn.vectorlayer);
            btn.control.deactivate();
        }
    },
    onGetLocationUpdate: function(e){
        this.vectorlayer.removeAllFeatures();

        var circle = new OpenLayers.Feature.Vector(
            OpenLayers.Geometry.Polygon.createRegularPolygon(
                new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                e.position.coords.accuracy/2,
                40,
                0
            ),
            {},
            {
                fillColor: '#C3DAF9',
                fillOpacity: 0.3,
                strokeColor: '#2B92F4',
                strokeWidth: 1
            }
        );
        this.vectorlayer.addFeatures([
            new OpenLayers.Feature.Vector(
                e.point,
                {},
                {
                    graphicName: 'circle',
                    strokeColor: '#2B92F4',
                    strokeWidth: 1,
                    fillOpacity: 1,
                    fillColor: '#5BADFF',
                    pointRadius: 6
                }
            ),
            circle
        ]);

        this.olMap.zoomToExtent(this.vectorlayer.getDataExtent());
    },
    onGetLocationUpdateError: function(){
        console.log('Location detection failed');
    },
    setToolbarVisibility: function(tb, newCard, oldCard){
        var tb = this.getToolbar(),
            bool;

        bool = (newCard.id == 'webgis') ? true : false;

        tb.setVisible(bool);
    }
});