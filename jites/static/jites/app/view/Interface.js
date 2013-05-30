/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:58 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.Interface',{
    extend: 'Ext.tab.Panel',

    alias : 'widget.interface',

//    tabPosition: 'left',

    layout: 'fit',
    defaults: {
        bodyPadding: 10,
        disabledCls: 'jites-empty-area',
        hideMode: 'offsets'
    },

    deferredRender: false,
    id: 'interface',

    flex: 1,

    initComponent: function() {
        var me = this;

        me.items = [
            {
                xtype: 'container',
                title: 'Action graph',
                disabled: true,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                id: 'actiongraph'
            },{
                xtype: 'container',
                title: 'Action details',
                disabled: true,
                id: 'actiondetails'
            },{
                xtype: 'container',
                title: 'Webgis area',
                disabled: true,
                layout: 'fit',
                id: 'webgis'
            },{
                xtype: 'container',
                title: 'Event chronology ',
                disabled: true,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                id: 'eventlog'
            }
        ]

        me.callParent(arguments);
    }
});

