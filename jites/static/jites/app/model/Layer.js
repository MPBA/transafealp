Ext.define('Jites.model.Layer', {
    extend: 'Ext.data.Model',
    
    fields: [
    'id',
    'name',
    'map',
    {"name": 'opacity', "type": 'float', "default": 1},
    'displayInLayerSwitcher',
    {"name": "isTimeLayer", "type": "boolean", "default": false}
    ],
    
    proxy: {
        type: 'memory',
        reader: {
            type: 'json'
        }
    }
    
});
