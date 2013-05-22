/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:58 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.InterfaceExtended',{
    extend: 'Ext.panel.Panel',

    alias : 'widget.interface',

    layout: {
        type: 'table',
        columns: 2
    },

    defaults: {
        disabledCls: 'jites-empty-area'
    },

    initComponent: function() {
        var me = this

        me.items = [
            {
                xtype: 'container',
                id: 'actiongraph',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                disabled: true,
                width: me.componentSize.wRow1,
                height: me.componentSize.hRow1
            },{
                xtype: 'container',
                id: 'actiondetails',
                disabled: true,
                width: me.componentSize.wRow1,
                height: me.componentSize.hRow1
            },{
                xtype: 'container',
                id: 'webgis',
                disabled: true,
                width: me.componentSize.wRow1,
                height: me.componentSize.hRow2
            },{
                xtype: 'container',
                id: 'eventlog',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                disabled: true,
                width: me.componentSize.wRow1,
                height: me.componentSize.hRow2
            }
        ];

        me.callParent(arguments);
    }
});
