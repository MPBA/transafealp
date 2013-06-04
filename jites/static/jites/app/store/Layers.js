Ext.define('Jites.store.Layers', {
    extend: 'Ext.data.Store',
    
    model: 'Jites.model.Layer',
   
    data: [],

    proxy: {
        type: 'memory',
        reader: {
            type: 'json'
        }
    }
});
