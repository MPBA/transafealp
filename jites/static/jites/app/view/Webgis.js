/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/24/13
 * Time: 12:44 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.Webgis',{
    extend: 'Ext.panel.Panel',
    alias : 'widget.webgisinterface',
    layout: {
        type: 'border'
    },
    initComponent: function() {
        var me = this;

        me.items = [
            {
                id: 'webgiswest',
                region: 'west',
                collapsible: true,
                collapseMode: 'mini',
                split: true,
                layout: 'fit',
                cls: 'x-baseinterface-west-body',
                hideCollapseTool: true,
                autoScroll:false,
                border: false,
                header: false,
                hidden: false,
                shadow: false,
                style: 'background-color: #FFFFFF',
                animCollapse: true,
                html:'test',
                width: 280
            },
            Ext.create('GeoExt.panel.Map',{
                map: me.map,
                id: 'webgiscenter',
                layout:'fit',
                border: false,
                region: 'center'
            })
        ]

        me.callParent(arguments);
    }
});