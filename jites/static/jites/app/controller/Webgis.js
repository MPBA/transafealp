/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/24/13
 * Time: 12:31 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.controller.Webgis', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'webgis',
        selector: '#webgis'
    }],

    init: function() {
        //Loads required classes by the given names (and all their direct dependencies)
        this.control({
            '#webgis': {
                added:{
                    fn: this.renderWebgis,
                    scope: this,
                    single: true
                }
            },
            '#webgiswest': {
                render:{
                    fn: this.renderFunctionPanel,
                    scope: this,
                    single: true
                }
            },
            'functionpanel toolbar button':{
                click: this.updatePanel
            }
        });
    },

    renderWebgis: function(){
        var me = this,
            parent = me.getWebgis(),
            map;

        OpenLayers.ImgPath = '/static/openlayer/img/';
        extent =  new OpenLayers.Bounds(596825.316768,5437464.443338,1800249.889923,6097880.36763);

        layer = new OpenLayers.Layer.OSM( "Simple OSM Map");

        map = new OpenLayers.Map({
            theme: "/static/openlayer/css/style.css",
            restrictedExtent: extent,
            maxExtent: extent,
            projection: 'EPSG:900913',
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.Scale(),
                new OpenLayers.Control.ScaleLine()
            ]
        });

        map.addLayer(layer);

        //Add component to eventlog container
        parent.add(
            Ext.create('Jites.view.Webgis',{
                map: map
            })
        );

        Jites.maps = new Array(map);

        //Enable eventlog panel
        parent.setDisabled(false);
    },
    renderFunctionPanel: function(p){
        var fp = Ext.create('Jites.view.FunctionPanel');

        p.add(
            fp
        );

        fp.addNewComponent({
            classe: 'Jites.view.FunctionPanelInfo',
            name_btn: 'Info',
            options_btn: {
                pressed: true
            },
            options_obj: {}
        });

        fp.addNewComponent({
            classe: 'GeoExt.panel.Legend',
            name_btn: 'Legend',
            options_btn: {
                pressed: false
            },
            options_obj: {
                title: 'Legend',
                autoScroll: true,
                border: false,
                layerStore: GeoExt.panel.Map.guess().layers
            }
        })

    },
    updatePanel: function(btn){
        //Richiamo il pannello con le funzioni
        var p = btn.up("functionpanel");

        //Attivo la card associata al pulsante (parametro card_id del bottone).
        //Faccio il cast in maniera che il numero passato alla funzione setActiveItem sia intero
        p.getLayout().setActiveItem(parseInt(btn.card_id));
    }
});
