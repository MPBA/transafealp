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
    autoScroll: true,

    maps: Jites.maps[0],

    initComponent: function() {
        this.tpl = new Ext.Template(
            '<div>',
                '<p>Re routing model (based on pg_route function)</p>',
                '<p><span class="label label-info">Heads up!</span> The routing system is based on the alpchek2 road graph and there may be discrepancies with openstreetmap data.</p>',
                '<form>',
                    '<div id="routing-start-block">',
                        '<label><span class="badge">1.</span> Select start point (click on map)</label>',
                        '<input id="routing-start" class="input-block-level uneditable-input" type="text">',
                    '</div>',
                     '<div id="routing-end-block" style="display: none;">',
                        '<label><span class="badge">2.</span> Select end point (click on map)</label>',
                        '<input id="routing-end" class="input-block-level uneditable-input" type="text">',
                    '</div><div id="routing-polygon-block" style="display: none;">',
                        '<label><span class="badge">3.</span> Draw involved area (click on map)</label>',
                        '<textarea id="routing-polygon" class="input-block-level uneditable-input hidden" rows=3></textarea>',
                    '</div>',
//                        '<div id="rounting-type-block" style="display: none;">',
                    '<div id="rounting-type-block" data-toggle="buttons-radio" style="margin-top:10px; display: none; height: 60px">',
                        '<label><span class="badge">4.</span> Select routing model</label>',
                        '<button id="rounting-type-fastest" class="btn" routing="fastest">Fastest</button>',
                        '<button id="rounting-type-shortest" class="btn" routing="shortest">Shortest</button>',
                        '<button id="rounting-type-vulnerability" class="btn" routing="vulnerability">Vulnerability</button>',
                        '<input id="rounting-type" class="hidden" type="text">',
                    '</div>',
                    '<div id="rounting-vulnerability-block" data-toggle="buttons-radio" style=" display: none;">',
                        '<label><span class="badge">4a.</span> Select vulnerability</label>',
                        '<select id="rounting-vulnerability">',
                            '<option>landslides</option>',
                            '<option>mudslides</option>',
                            '<option>floods</option>',
                            '<option>earthquakes</option>',
                            '<option>avalanches</option>',
                            '<option>forestfires</option>',
                            '<option>scree</option>',
                        '</select>',
                    '</div>',
                '</form>',
                '<div id="routing-button-block" style="display: none; margin-top: 10px;">',
                '<button id="routing-submit" type="submit" class="btn btn-primary">Run re-routing</button>',
                '<button id="routing-cancel" type="button" class="btn">Cancel</button>',
                '</div>',
            '</div>'
        );

        this.data = {
//            height: me.logareaHeight,
//            width: me.logareaWidth
        };

        this.markers = new OpenLayers.Layer.Vector(
            "Re-routing Marker",
            {
                isBaseLayer: false,
                displayInLayerSwitcher: false
            }
        );

        this.vector = new OpenLayers.Layer.Vector("Re-routing polygon",{
            displayInLayerSwitcher: false
        });
        this.vector.onFeatureInsert = function(ft){
            $('#rounting-type-block').fadeIn();
        };

        this.map.addLayers([this.markers, this.vector]);

        this.callParent(arguments);
    },
    listeners: {
        'hide': function(panel){
            panel.polygoncontrol.deactivate();
            panel.dragfeaturecontrol.deactivate();
            panel.markers.removeAllFeatures();
            panel.vector.removeAllFeatures();

            $('#routing-start').val('');
            $('#routing-end').val('');
            $('#routing-polygon').val('');

            $('#routing-polygon-block').fadeOut();
            $('#routing-button-block').fadeOut();
            $('#routing-end-block').fadeOut();
            $('#rounting-type-block').fadeOut();
            $('#rounting-type-block').button('toggle')
        },
        'show': function(panel){
            panel.startcontrol.activate();
            panel.dragfeaturecontrol.activate();
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


            //Add drag feature on markers layers
            panel.dragfeaturecontrol = new OpenLayers.Control.DragFeature(panel.markers);
            panel.map.addControl(panel.dragfeaturecontrol);

            //Add event to start point
            Ext.get('routing-submit').on('click', function(event, target) {
                var start = $('#routing-start').attr('roadid'),
                    end = $('#routing-end').attr('roadid'),
                    wkt = new OpenLayers.Format.WKT(),
                    csfr = Ext.util.Cookies.get('csrftoken'),
                    multi = [],
                    multifeature,
                    vuln = $('#rounting-vulnerability').val();

                    if(!panel.vector.features.length){
                        Ext.MessageBox.show({
                            title: 'Attention',
                            msg: 'You must draw at least a polygon to continue.',
                            buttons: Ext.MessageBox.OK,
                            icon: Ext.MessageBox.INFO
                        });
                        return;
                    }

                    Ext.Array.each(panel.vector.features,function(el){
                        multi.push(el.geometry)
                    });


                    multifeature = new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.MultiPolygon(multi)
                    );

                Ext.Ajax.request({
                    url: '/jites/rerouting/'+$('#rounting-type').val(),
                    method: 'POST',
                    params: {
                        "polygon": wkt.write(multifeature),
                        "source": start,
                        "csrfmiddlewaretoken": csfr,
                        "target": end,
                        "vuln": vuln
                    },
                    scope: this,
                    success: function(response){
                        var r = Ext.decode(response.responseText),
                            vector,
                            stylemap,
                            json = new OpenLayers.Format.GeoJSON();


                        stylemap = new OpenLayers.StyleMap({
                            name: 'Rerouting',
                            title: "Re-routing",
                            strokeWidth: 4,
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
                        console.log('errore');
                    }
                });

            }, this);

            //Handler for select routing type
            Ext.get('rounting-type-block').on('click', function(event, target) {
                if(target.getAttribute('routing') == 'vulnerability'){
                    $('#rounting-vulnerability-block').fadeIn()
                } else {
                    $('#rounting-vulnerability-block').fadeOut();
                }

                $('#rounting-type').val(target.getAttribute('routing'));
                $('#routing-button-block').fadeIn();
            }, this, {delegate: 'button'});

            //handler for cancel button
            Ext.get('routing-cancel').on('click', function(event, target) {
                this.polygoncontrol.deactivate();
                this.dragfeaturecontrol.deactivate();
                this.markers.removeAllFeatures();
                this.vector.removeAllFeatures();

                panel.startcontrol.activate();
                panel.dragfeaturecontrol.activate();

                $('#routing-start').val('');
                $('#routing-end').val('');
                $('#routing-polygon').val('');

                $('#routing-polygon-block').fadeOut();
                $('#routing-button-block').fadeOut();
                $('#routing-end-block').fadeOut();
                $('#rounting-type-block').fadeOut();
                $('#rounting-type-block').button('toggle');
            }, panel);
        }
    },

    getFeaturesEnd: function(e){
        var url;
        var lonlat = this.map.getLonLatFromPixel(e.xy);
        var map = this.map;

        url = Ext.String.format('http://transafealp.fbk.eu/geoserver/wms?' +
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
                        var lon = lonlat.lon,
                            lat = lonlat.lat;

                        var ft = new OpenLayers.Feature.Vector(
                            new OpenLayers.Geometry.Point(lon, lat)
                        );
                        ft.style = {
                            externalGraphic: "/static/jites/resources/images/icons/finish2.png",
                            pointRadius: 20,
                            graphicYOffset: -40
                        };
                        this.handlerOptions.ref.markers.addFeatures(ft);

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

                    } else {
                        Ext.MessageBox.show({
                            title: 'Click info',
                            msg: 'Select a section of alpcheck2 road',
                            buttons: Ext.MessageBox.OK,
                            icon: Ext.MessageBox.INFO
                        });
                    }
                },
                failure: function(){
                    Ext.MessageBox.show({
                        title: 'Click info',
                        msg: 'Select a section of alpcheck2 road',
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.INFO
                    }).show();
                }

            });
    },
    getFeatureStart: function(e){
        var url;
        var lonlat = this.map.getLonLatFromPixel(e.xy);
        var map = this.map;


        url = Ext.String.format('https://transafealp.fbk.eu/geoserver/wms?' +
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
                    var lon = lonlat.lon,
                        lat = lonlat.lat;

                    var ft = new OpenLayers.Feature.Vector(
                        new OpenLayers.Geometry.Point(lon, lat)
                    );
                    ft.style = {
                        externalGraphic: "/static/jites/resources/images/icons/start-race-2.png",
                        pointRadius: 20,
                        graphicYOffset: -40
                    };
                    this.handlerOptions.ref.markers.addFeatures(ft);

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
                    Ext.MessageBox.show({
                        title: 'Click info',
                        msg: 'Select a section of alpcheck2 road',
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.INFO
                    });
                }
            },
            failure: function(){
                Ext.MessageBox.show({
                    title: 'Click info',
                    msg: 'Select a section of alpcheck2 road',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.INFO
                });
            }
        });
    }
});