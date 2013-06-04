Ext.define('Jites.view.WebgisLayerSwitcher', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.layerswitcher',

    requires: [
        'Jites.model.Layer',
        'Jites.store.Layers',
        'Ext.grid.column.Action'
    ],

    layout: 'fit',
    border: false,

    /* *
     * Se falso il TreePanel LayerSwitcher non rimane in ascolto su aggiunta, rimozione,
     * cambio del layer nel layerstore.
     *
     */
    dynamic: true,

    /* *
     * Il layer store che contiene i layers da visualizzare nella TreePanel,
     * se non viene indicato viene preso dal parametro map.
     *
     */
    store: [],

    /* *
     * La mappa che si vuole associare a questo TreePanel.
     * RICHIESTO
     *
     */
    map: null,

    /* *
     * Setto le linee tra una riga e l'altra tella griglia
     *
     */
    columnLines: true,

    /* *
     * Setto i bordi arrotondati per il panello
     *
     */
    frame: true,

    margin: '0 0 5 0',


    viewConfig: {
        plugins: {
            ptype: 'gridviewdragdrop',
            dragGroup: 'GridDDGroup0',
            dropGroup: 'GridDDGroup0'
        },
        listeners: {
            drop: function(element, dataObj, overModel, dropPosition) {
                var map = Jites.maps[0];

                var lDroped = map.getLayersBy('id',dataObj.records[0].getId())[0];
                var lOver = map.getLayersBy('id',overModel.getId())[0];

                var lDropedIdx = map.getLayerIndex(lDroped);
                var lOverIdx = map.getLayerIndex(lOver);
                if (dropPosition == 'after'){
                    var newIdx = lOverIdx;
                } else {
                    var newIdx = lOverIdx;
                }
                var nuovoIdx = lDropedIdx - lOver;

                map.setLayerIndex(lDroped,newIdx)

            }
        }
    },


    initComponent: function () {
        //~ //Setto le colonne da vedere nella griglia
        this.columns = [
            {text: 'Layer name', flex: 1, dataIndex: 'name'},
            {
                text: 'Opacity',
                dataIndex: 'opacity',
                width: 50,
                align: 'right',
                editor: {
                    xtype: 'numberfield',
                    allowBlank: false,
                    minValue: 0,
                    maxValue: 1,
                    step: 0.1,
                    allowDecimals: true
                }
            },
            {
                xtype: 'actioncolumn',
                width: 22,
                items: [
                    {
                        icon: '/static/resources/images/delete.png',
                        tooltip: 'Delete',
                        name: 'gridfunction',

                        handler: function (grid, rowIndex, colIndex) {
                            var record = grid.getStore().getAt(rowIndex);
                            var map = record.data.map
                            var layer = map.getLayersBy('id', record.data.id)
                            map.removeLayer(layer[0]);
                        }
                    }
                ]
            }
        ];

		this.plugins = [
			Ext.create('Ext.grid.plugin.CellEditing', {
				clicksToEdit: 1
			})
		];

        //Creo il Webgis.store.Layers per questo TreePanel e ne faccio il load per caricare i dati presenti nella mappa
        var store = new Jites.store.Layers({
            data: this.map.getLayersBy('displayInLayerSwitcher', true),
            listeners: {
                'update': function (store, record, op) {
                    rec = record
                    if (op == Ext.data.Model.EDIT) {
                        //Assumo che l'id del layer generato da OpenLayer sia sempre univoco e quindi rappresenti sempre un solo layer
                        var layer = rec.data.map.getLayersBy('id', rec.getId())[0];
                        layer.setOpacity(rec.data.opacity);
                        record.commit();
                    }
                }
            }
        })
        this.store = store;

        //Setto i listernes per registrare gli eventi sulla mappa (solo se la configurazione dynamic e' true)
        if (this.dynamic) {
            this.map.store = this.store;
            this.map.events.on({
                'addlayer': this.addRow,
                'removelayer': this.removeRow,
                scope: this
            });
        }
        this.callParent(arguments);
    },
    removeRow: function (object) {
        var map = object.object;
        var layer = object.layer;
        var store = map.store;
        var idx = store.find('id', layer.id);
        store.removeAt(idx);
    },
    addRow: function (object) {
        var map = object.object;
        var store = map.store;
        var layer = object.layer;
        //~ layer.layerIndex = map.getLayerIndex(layer);
        //Verifico se e' impostato come displayInLayerSwitcher
        if (layer.displayInLayerSwitcher) {
            var record = Ext.create('Jites.model.Layer', layer);
            store.insert(0, record);
        }
    }
});
