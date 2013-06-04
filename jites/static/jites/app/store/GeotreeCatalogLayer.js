Ext.define('Jites.store.GeotreeCatalogLayer', {
    extend: 'Ext.data.TreeStore',

    autoLoad: true,
    proxy: {
        type: 'rest',
        url: '/api/layer/',
        reader: {
            type: 'json',
            root: 'data'
        },
        writer: {
            type: 'json'
        },
        appendId: true,
        listeners: {
            exception: function(proxy,response){
                var err = Ext.decode(response.responseText);
                Ext.MessageBox.show({
                    title:'Errore nel catalogo layer',
                    msg: err.message,
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.ERROR
                });
            }
        }


    },

//    nodeParam: 'internal_id',
    nodeParam: 'id',

    root: {
        text: 'my Root',
        expanded: true,
        id: 0
    }
});
