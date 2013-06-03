Ext.define('Jites.store.WmsCapabilities', {
    extend: 'Ext.data.Store',

    model: 'Jites.model.WmsCapabilities',

    proxy: {
        type: 'memory',
        reader: {
            type: 'json'
        }
    },

    data: []
});
