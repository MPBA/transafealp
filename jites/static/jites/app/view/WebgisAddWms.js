Ext.define('Jites.view.WebgisAddWms', {
    extend: 'Ext.form.Panel',
    alias : 'widget.wmscapabilities',

    border: false,
    frame: true,

    width: 250,

    title: 'Aggiungi un layer esterno',

    layout: 'anchor',
    defaults: {
        anchor: '100%'
    },

    olMap: Jites.maps[0],

    defaultType: 'textfield',

    autoScroll: true,

    maps: Jites.maps[0],

    initComponent: function() {
        this.items = [{
            xtype: 'displayfield',
            hideLabel: true,
            name: 'home',
            margin: '0 0 15 0',
            value: 'Per aggiungere un layer usando una risorsa OGC standard esterna e\'sufficiente inserire l\'url del server' +
                '<br/><b>Attenzione!</b><br/>Si ricorda che la risorsa deve essere accessibile dal computer che si sta utilizzando e deve essere pubblicato in EPSG:32632.<br/><br/>' +
                'La chiamata deve essere del tipo http://enviro.fbk.eu/geoserver/land/wms?<br/>SERVICE=WMS&VERSION=1.1.1<br/>&REQUEST=GetCapabilities'
        },{
            fieldLabel: 'GET CAPABILITIES URL',
            labelAlign: "top",
            xtype:'textarea',
            name: 'ierver',
            value: 'http://enviro.fbk.eu/geoserver/land/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
            allowBlank: false
        },{
            text: 'Connetti',
            xtype: 'button',
            iswms: true
        },{
            title: 'Layer disponibili',
            store: this.store,
            columns: [
                {
                    xtype:'templatecolumn',
                    tpl: new Ext.XTemplate(
                        '<div>{title}</div>',
                        '<div><i>{abstract}</i></div>'
                    ),
                    flex: 1
                },
                {
                    xtype:'actioncolumn',
                    width:30,
                    items: [{
                        icon: '/static/resources/images/addmap.png',  // Use a URL in the icon config
                        tooltip: 'Aggiungi alla mappa',
                        handler: function(grid, rowIndex, colIndex,item,e,record) {
                            var getmapurl = grid.getStore().getmapurl;
                            var rec = grid.getStore().getAt(rowIndex);
                            var map = this.up("form").maps;
                            var l = new OpenLayers.Layer.WMS(rec.get('title'),
                                getmapurl,
                                {
                                    layers: rec.get('name'),
                                    transparent: true
                                });
                            map.addLayer(l);
                        }
                    }]
                }
            ],
            xtype: 'grid',
            margin: '15 0 0 0',
            height: '100%'
        }];

        this.callParent(arguments);
    }
});