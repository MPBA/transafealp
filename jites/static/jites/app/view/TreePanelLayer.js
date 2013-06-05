Ext.define('Jites.view.TreePanelLayer', {
    extend: 'Ext.tree.Panel',
    alias : 'widget.geotreecataloglayer',

    id: 'geotreecataloglayer',

    layout: 'fit',
    border: false,

//    header: false,
//    hideHeaders: true,

    title: '<h4>Layer catalog</h4>',

    frame: true,

    hideHeader: true,

    rootVisible: false,
    useArrows: true,

    maps: Jites.maps,

    columns: [{
        xtype: 'treecolumn', //this is so we know which column will show the tree
        text: 'Nome',
        flex: 2,
        sortable: false,
        dataIndex: 'text'
    }
// {
//        text: 'Delete',
//        width: 20,
//        menuDisabled: true,
//        xtype: 'actioncolumn',
//        tooltip: 'Elimina il tematismo',
//        align: 'center',
//        cls: 'x-treepanel-metedata',
//        icon: '/static/resources/images/icons/delete.png',
//        handler: function(grid, rowIndex, colIndex, actionItem, event, record, row) {
//
//            record.destroy({
//                scope: grid,
//                success: function() {
////                    console.log('The layer was destroyed!');
//                },
//                failure: function(){
//
//                    var st = this.up("treepanel").getStore();
//                    st.load(0);
////                    console.log('The layer was not destroyed!');
//                }
//            });
//        },
//
//        // Only leaf level tasks may be edited
//        isDisabled: function(view, rowIdx, colIdx, item, record) {
//            var res;
//            if(record.get('leaf') && !record.get('public')){
//                res = false;
//            } else {
//                res = true;
//            }
//            return res;
//        }
//    },{
//        text: 'Metadata',
//        width: 20,
//        menuDisabled: true,
//        xtype: 'actioncolumn',
//        tooltip: 'Guarda la scheda Metadati',
//        align: 'center',
//        cls: 'x-treepanel-metedata',
//        icon: '/static/resources/images/icons/info.png',
//        handler: function(grid, rowIndex, colIndex, actionItem, event, record, row) {
//            grid.up('treepanel').viewMetadata(record.get('real_id'));
//        },
//
//        // Only leaf level tasks may be edited
//        isDisabled: function(view, rowIdx, colIdx, item, record) {
//            return !record.get('has_metadata')
//        }
//    }
    ],

    initComponent: function() {
        this.listeners = {
            checkchange:{
                fn: 'onCheckChange',
                scope: this
            }
        };

        this.maps[0].events.on({
            'removelayer': this.updateCheckbox,
            scope: this
        });

        this.callParent(arguments);
    },
    onCheckChange: function(node,ischecked){
        if(node.isLeaf()){
            if(ischecked){
//                console.log(node.getData());
//                console.log(node);
                this.addLayerToMap(this.maps[0],node);
            } else {
                this.rmLayerFromMap(this.maps[0],node.getData());
            }
        }
    },
    addLayerToMap: function(m,node){
        var nd = node.getData();
        var layer_workspace = nd.gs_workspace;
        var layer_name = this.getLayerName(layer_workspace,nd.gs_name);
        var layer_label = this.getLayerLabel(nd.text);
        var layer_url = nd.gs_url;
        var style_url = nd.gs_legend_url;
        //Var locale con lo stile
        var style = nd.style;


        //Setting dei parametri per il WMS GetMap
        var params = {
            styles: style,
            layers:  layer_name,
            format: 'image/png',
            transparent: true
        }

        //Setting per l'oggetto OpenLayers.Layers
        var options = {
            isBaseLayer: false,
            style_url: style_url,
            displayInLayerSwitcher: true,
            visibility: true,
            projection: m.projection,
            singleTile: true,
            opacity: 1
            //~ buffer: layer.fields.buffer,
            //~ tileSize: new OpenLayers.Size(layer.fields.tile_size,layer.fields.tile_size)
        }
        //Creo oggetto layer
        var l = new OpenLayers.Layer.WMS(layer_label,
            layer_url,
            params,
            options
        );
        l.addOptions({
            uniqueid: this.getUniqueId(nd),
            node: node
        });

        //Aggiungo l'oggetto layer alla corrispettiva mappa
        m.addLayer(l);
    },
    rmLayerFromMap: function(m,nodedata){
        var l = m.getLayersBy('uniqueid',this.getUniqueId(nodedata));
//      Mi aspetto che sia sempre solo un layer
        l[0].destroy()
    },
    getLayerName: function(layer_workspace,layer_name){
        //Se il workspace non e' nullo lo imposto nel nome del layer da chiamare
        if(layer_workspace!=null){
            var res = [layer_workspace, layer_name].join(":");
        } else {
            var res = layer_name;
        }
        return res;
    },
    getLayerLabel: function(text){
        return text;
    },
    getUniqueId:function(nodedata){
        return 'geotreelayer' + nodedata.id;

    },
    viewMetadata: function(id){
        Ext.Ajax.request({
            url: '/api/metadata/'+id,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);
//                Ext.create('Jites.view.function.GeotreeMetaLayer',{
//                    data: obj.data
//                });
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
            }
        });

    },
    updateCheckbox: function(obj){
        var l = obj.layer;
        if(l.node instanceof Jites.model.GeotreeCatalogLayer){
            l.node.data.checked=false;
            l.node.commit();
        }
    }
});