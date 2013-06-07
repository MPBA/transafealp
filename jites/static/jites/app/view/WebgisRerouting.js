/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/17/13
 * Time: 11:30 AM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.WebgisRerouting', {
    extend: 'Ext.panel.Panel',
    alias : 'widget.webgisrerouting',

    border: false,
    frame: true,

    width: 250,

    title: '<h4>Re-routing settings</h4>',

    layout: 'fit',
//    defaults: {
//        anchor: '100%'
//    },
//
//    defaultType: 'textfield',
//
//    autoScroll: true,

    maps: Jites.maps[0],

    initComponent: function() {
        this.tpl = new Ext.Template(
            '<div>',
                '<p>Re routing model (based on pg_route function)</p>',
                '<p><span class="label label-info">Heads up!</span> The routing system is based on the alpchek2 road graph and there may be discrepancies with openstreetmap data.</p>',
                '<form>',
                    '<fieldset>',
                        '<div id="routing-start-block">',
                            '<label><span class="badge">1.</span> Select start point (click on map)</label>',
                            '<input id="routing-start" class="input-block-level uneditable-input" type="text">',
                        '</div>',
                         '<div id="routing-end-block" style="display: none;">',
                            '<label><span class="badge">2.</span> Select end point (click on map)</label>',
                            '<input id="routing-end" class="input-block-level uneditable-input" type="text">',
                        '</div><div id="routing-polygon-block" style="display: none;">',
                            '<label><span class="badge">3.</span> Draw involved area (click on map)</label>',
                            '<textarea id="routing-polygon" class="input-block-level uneditable-input" rows=3></textarea>',
                        '</div>',
                    '</fieldset>',
                '</form>',
                '<div id="routing-button-block" style="display: none;">',
                '<button id="routing-submit" type="submit" class="btn btn-primary">Run re-routing</button>',
                '<button id="routing-cancel" type="button" class="btn">Cancel</button>',
                '</div>',
            '</div>'
        );

        this.data = {
//            height: me.logareaHeight,
//            width: me.logareaWidth
        };

        //aggiungo markers e vector
        this.markers = new OpenLayers.Layer.Markers( "Re-routing" );
        this.vector = new OpenLayers.Layer.Vector("Re-routing polygon",{
            displayInLayerSwitcher: false
        });

        this.map.addLayers([this.markers, this.vector]);

        this.callParent(arguments);
    },
    listeners: {
        'hide': function(){
            console.log('azzero tutto');
        },
        'afterrender': function(panel){

            panel.startcontrol = new OpenLayers.Control.Click({
                handlerOptions: {
                    "single": true,
                    "ref": this
                },
                fn: panel.getFeatureStart
            });
            panel.endcontrol = new OpenLayers.Control.Click({
                handlerOptions: {
                    "single": true,
                    "ref": this
                },
                fn: panel.getFeaturesEnd
            });
            panel.polygoncontrol = new OpenLayers.Control.DrawFeature(
                panel.vector,
                OpenLayers.Handler.Polygon,
                {handlerOptions: {holeModifier: "altKey"}}
            );
            panel.map.addControl(this.startcontrol);
            panel.map.addControl(this.endcontrol);
            panel.map.addControl(this.polygoncontrol);

            panel.startcontrol.activate();

            //add event to polygon draw
            panel.vector.onFeatureInsert = function(ft){
                console.log(ft)
            };

            //Add event to start point
//            console.log(panel.map);
            Ext.get('routing-button-block').on('click', function(event, target) {
                var start = $('#routing-start').attr('roadid'),
                    end = $('#routing-end').attr('roadid'),
                    wkt = new OpenLayers.Format.WKT(),
                    csfr = Ext.util.Cookies.get('csrftoken'),
                    poly = wkt.write(panel.vector.features);

                Ext.Ajax.request({
                    url: '/jites/rerouting/shortest',
                    method: 'POST',
                    params: {
                        "polygon": poly,
                        "source": start,
                        "csrfmiddlewaretoken": csfr,
                        "target": end
                    },
                    scope: this,
                    success: function(response){
                        var r = Ext.decode(response.responseText),
                            vector,
                            stylemap,
                            json = new OpenLayers.Format.GeoJSON();


                        stylemap = new OpenLayers.StyleMap({
                            strokeWidth: 2,
                            strokeColor: '#3d2d84'
                        });
                        vector = new OpenLayers.Layer.Vector("Path",{
                            styleMap: stylemap
                        });

                        vector.addFeatures(
                            json.read(r.path)
                        );

                        Jites.maps[0].addLayer(vector);
                    },
                    failure: function(){
                        console.log('errore')
                    }
                });

            }, this, {delegate: 'button'});
        }
    },

    getFeaturesEnd: function(e){
        var url;
        var lonlat = this.map.getLonLatFromPixel(e.xy);
        var map = this.map;

        url = Ext.String.format('http://geodata.fbk.eu:50002/geoserver/tsa/wms?' +
            'REQUEST=GetFeatureInfo&EXCEPTIONS=application/vnd.ogc.se_xml&BBOX={0}' +
            '&SERVICE=WMS&INFO_FORMAT=application/json&QUERY_LAYERS=tsa:alpcheck2_agis_reroute_4326&' +
            'FEATURE_COUNT=1&Layers=tsa:alpcheck2_agis_reroute_4326&WIDTH={1}&HEIGHT={2}&' +
            'format=image/png&styles=&srs=EPSG%3A900913&version=1.1.1&x={3}&y={4}',
            map.getExtent().toBBOX(),
            map.getSize().w,
            map.getSize().h,
            e.xy.x,
            e.xy.y
        );

        Ext.Ajax.request({
                url: url,
                method: 'GET',
                scope: this,
                success: function(response){
                    var r = Ext.decode(response.responseText);
                    if(r.features.length){
                        //Add markers to the map
                        var size = new OpenLayers.Size(32,37);
                        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                        var icon = new OpenLayers.Icon('/static/jites/resources/images/icons/finish2.png', size, offset);
                        this.handlerOptions.ref.markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lonlat.lon,lonlat.lat),icon));

                        //Set friendly name
                        var text = r.features[0].properties.stateroadn ? r.features[0].properties.stateroadn : '';
                        text = (r.features[0].properties.streetname) ? text + ' ' + r.features[0].properties.streetname : text + '';
                        $('#routing-end').val(text ? text : 'Street name not available.');

                        //Set attribute for wps input
                        $('#routing-end').attr('roadid',r.features[0].properties.target);

                        //Setting correct handler status
                        this.deactivate();
                        this.handlerOptions.ref.polygoncontrol.activate();

                        //Visualizing next block
                        $('#routing-polygon-block').fadeIn();
                        $('#routing-button-block').fadeIn();
                    } else {
                        console.log('nessuna feature selezionata');
                    }
                },
                failure: function(){
                    console.log('errore')
                }

            });
    },
    getFeatureStart: function(e){
        var url;
        var lonlat = this.map.getLonLatFromPixel(e.xy);
        var map = this.map;


        url = Ext.String.format('http://geodata.fbk.eu:50002/geoserver/tsa/wms?' +
            'REQUEST=GetFeatureInfo&EXCEPTIONS=application/vnd.ogc.se_xml&BBOX={0}' +
            '&SERVICE=WMS&INFO_FORMAT=application/json&QUERY_LAYERS=tsa:alpcheck2_agis_reroute_4326&' +
            'FEATURE_COUNT=1&Layers=tsa:alpcheck2_agis_reroute_4326&WIDTH={1}&HEIGHT={2}&' +
            'format=image/png&styles=&srs=EPSG%3A900913&version=1.1.1&x={3}&y={4}',
            map.getExtent().toBBOX(),
            map.getSize().w,
            map.getSize().h,
            e.xy.x,
            e.xy.y
        );

        Ext.Ajax.request({
            url: url,
            method: 'GET',
            scope: this,
            success: function(response){
                var r = Ext.decode(response.responseText);
                if(r.features.length){
                    //Add markers to the map
                    var size = new OpenLayers.Size(32,37);
                    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
                    var icon = new OpenLayers.Icon('/static/jites/resources/images/icons/start-race-2.png', size, offset);
                    this.handlerOptions.ref.markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lonlat.lon,lonlat.lat),icon));

                    //Set friendly name
                    var text = r.features[0].properties.stateroadn ? r.features[0].properties.stateroadn : '';
                    text = (r.features[0].properties.streetname) ? text + ' ' + r.features[0].properties.streetname : text + '';
                    $('#routing-start').val(text ? text : 'Street name not available.');

                    //Set attribute for wps input
                    $('#routing-start').attr('roadid',r.features[0].properties.source);

                    //Setting correct handler status
                    this.deactivate();
                    this.handlerOptions.ref.endcontrol.activate();

                    //Visualizing next block
                    $('#routing-end-block').fadeIn();
                } else {
                    console.log('nessuna feature selezionata');
                }
            },
            failure: function(){
                console.log('errore')
            }
        });
    }
});