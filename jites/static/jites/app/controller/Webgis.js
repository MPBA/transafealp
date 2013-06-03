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
    },{
        ref: "webgiseastpanel",
        selector: "#functionpanelcardarea"
    },{
        ref: 'fnpanel',
        selector: '#functionpanelcardbtnarea'
    }],

    stores: [
        'WmsCapabilities'
    ],

    card_id: 1,
//    requires: [
//        'GeoExt.container.WmsLegend',
//        'GeoExt.container.UrlLegend',
//        'GeoExt.container.VectorLegend',
//        'GeoExt.panel.Legend'
//    ],

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
                    fn: this.renderWebgisWest,
                    scope: this,
                    single: true
                }
            },
            'functionpanel toolbar button':{
                click: this.updatePanel
            },
            '#functionpanelcardarea':{
                render: {
                    fn: this.renderFunctionPanelCard,
                    scope: this,
                    single: true
                }
            },
            '#functionpanelcardarea button[iscard]':{
                click: this.updateBtnPanel
            },
            'wmscapabilities button[iswms]':{
                click: {
                    fn:this.connectToWmsServer,
                    scope:this
                }
            }
        });
    },

    renderWebgis: function(){
        var me = this,
            parent = me.getWebgis(),
            markers,
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

        //Add event point location to map
        var size = new OpenLayers.Size(32,37);
        var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
        var icon = new OpenLayers.Icon('/static/jites/resources/images/icons/caution.png', size, offset);

        markers = new OpenLayers.Layer.Markers( "Markers" );
        markers.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(Jites.event.lon,Jites.event.lat),icon));

        map.addLayer(markers);

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
    renderWebgisWest: function(p){
        var fp = Ext.create('Jites.view.FunctionPanel');

        //Add function panel (whit button toolbar to access at specified card)
        p.add(
            fp
        );

        //Add card function panel info
        fp.addNewComponent({
            classe: 'Jites.view.FunctionPanelInfo',
            name_btn: 'Info',
            options_btn: {
                pressed: true
            },
            options_obj: {}
        });

        //add card function panel legend
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
        });

        //add card function panel button (whit multi button)
        fp.addNewComponent({
            classe: 'Jites.view.FunctionPanelCard',
            name_btn: 'Function',
            options_btn: {
                pressed: false
            },
            options_obj: {
                title: 'Function',
                autoScroll: true,
                border: false
            }
        });
    },
    renderFunctionPanelCard: function(p){
        var body3 = Ext.create('Ext.panel.Panel',{html:'pippo'});
        var btn3 = this.addCardBtn('btn-fn-filtro','Filtra <br/>segnalazioni','',body3);

        var body6 = Ext.create('Jites.view.WebgisAddWms',{
            store: this.getWmsCapabilitiesStore()
        });

        this.addCardBtn(Ext.id(),'Aggiungi <br/>WMS','',body6);
    },
    addToggleBtn: function(btn,opt){
        this.getFnpanel().add(Ext.create(btn,opt));
    },
    addCardBtn: function(btnid,text, iconcls, body){
        var btn = Ext.create('Jites.view.BaseButton',{
            id: btnid,
            text: text,
            iconCls: iconcls,
            iscard: true,
            card_id: this.getNewCardId()
        });
        this.getFnpanel().add(btn);

        //add dock item whit return btn
        body.addDocked({
            border: false,
            dock: 'bottom',
            xtype: 'button',
            iscard: true,
            componentCls: 'x-base-return-button',
            card_id: 0,
            text: 'Chiudi ' + text
        },0);


        this.getWebgiseastpanel().add(body);
        return btn;
    },
    getCardId: function(){
        return this.card_id;
    },
    setCardId: function(){
        this.card_id = this.card_id + 1;
    },
    getNewCardId: function(){
        var old = this.card_id;
        this.setCardId();
        return old;
    },
    updatePanel: function(btn){
        //Richiamo il pannello con le funzioni
        var p = btn.up("functionpanel");

        //Attivo la card associata al pulsante (parametro card_id del bottone).
        //Faccio il cast in maniera che il numero passato alla funzione setActiveItem sia intero
        p.getLayout().setActiveItem(parseInt(btn.card_id));
    },
    updateBtnPanel: function(btn){
        //Attivo la card associata al pulsante (parametro card_id del bottone).
        //Faccio il cast in maniera che il numero passato alla funzione setActiveItem sia intero
        this.getWebgiseastpanel().getLayout().setActiveItem(parseInt(btn.card_id));
        console.log('btn');
    },
    connectToWmsServer: function(btn){
        var myMask = new Ext.LoadMask(btn.up('form'), {msg:"Richiesta in corso..."});
        myMask.show();

        var baseurl = btn.prev("textarea").getValue();
        //var url = baseurl.trim() + '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities'

        Ext.Ajax.request({
            url: '/jites/proxy?url='+encodeURIComponent(baseurl.trim()),
            method: 'GET',
            scope: this,
//            params: {
//                SERVICE: "WMS",
//                VERSION: "1.1.1",
//                REQUEST: "GetCapabilities"
//            },
            success: function(response){
                var format = new OpenLayers.Format.WMSCapabilities({
//                    version: "1.1.1"
                });
                layers = format.read(response.responseText);
                this.getWmsCapabilitiesStore().getmapurl = layers.capability.request.getmap.href;
                this.getWmsCapabilitiesStore().loadData(layers.capability.layers);
                myMask.destroy();
            },
            failure: function(){
                Ext.Msg.alert('Errore', 'Siamo spiacenti il server indicato ha fornito un documento di "capabilities" che non e\' stato possibile processare.');
                myMask.destroy();
            }
        });
    }
});
