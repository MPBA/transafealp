Ext.define('Jites.model.GeotreeCatalogLayer', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id', type: 'int'},
        {name: 'real_id', type: 'int'},
        {name: 'text', type: 'string',mapping:'name'},
        {name: 'creation_time', type:'date', dateFormat:'c'},
        {name: 'numcode', type: 'int'},
        {name: 'tableschema'},
        {name: 'code_column'},
        {name: 'time_column'},
        {name: 'leaf', type: 'boolean', default: false},
        {name: 'has_metadata', type: 'boolean'},
        {name: 'public', type: 'boolean', default: true},
        {name: 'group_id', type: 'int'},
        {name: 'geom_column', type: 'string'},
        {name: 'qtip', type:'string', mapping:'ui_qtip'},
        {name: 'gs_name'},
        {name: 'gs_workspace'},
        {name: 'gs_url'},
        {name: 'gs_legend_url'},
        {name: 'style'}
    ],

    proxy: {
        type: 'rest',
        url: '/api/layer/',
        reader: {
            type: 'json',
            root: 'data'
        },
        writer: {
            type: 'json'
        }

    }
});