Ext.define('Jites.model.WmsCapabilities', {
    extend: 'Ext.data.Model',
    requires: ['Ext.data.SequentialIdGenerator'],
    idgen: 'sequential',
    fields: [
        {name: 'name', type: 'string'},
        {name: 'abstract', type: 'string'},
        {name: 'format', type: 'string'},
        {name: 'title', type: 'string'},
        {name: 'srs', type: 'string'}
    ]

});
