Ext.define('Jites.view.WebgisAddWms', {
    extend: 'Ext.form.Panel',
    alias : 'widget.wmscapabilities',

    border: false,
    frame: true,

    width: 250,

    title: '<h4>Add external wms</h4>',

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
            value: '<p>WMS layers con be added quite simple, as long as you know the URL to access the WMS Server.</p>' +
                '<p><span class="label label-important">Attention!</span> You must have a serviceable connection to the server and the server should expose the maps in <strong>ESPG:3857</strong></p>' +
                '<p>Example url: <code>https://spatialdb.fbk.eu/wms</code></p>'
        },{
            fieldLabel: 'WMS url',
            labelAlign: "top",
            xtype:'textarea',
            name: 'ierver',
            value: 'https://spatialdb.fbk.eu/geoserver/wms',
            allowBlank: false
        },{
            text: 'Connect',
            xtype: 'button',
            iswms: true
        },{
            title: 'Available layers',
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
                        icon: '/static/jites/resources/images/icons/addmap.png',  // Use a URL in the icon config
                        tooltip: 'Add to map',
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