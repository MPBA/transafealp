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
        disabledCls: 'jites-empty-area'
    },

    flex: 1,

    initComponent: function() {
        var me = this;

        me.items = [
            {
                title: 'Action graph',
                id: 'actiongraph'
            },{
                title: 'Action details',
                disabled: true,
                id: 'actiondetails'
            },{
                title: 'Webgis area',
                disabled: true,
                id: 'webgis'
            },{
                title: 'Event chronology ',
                disabled: true,
                id: 'chronology'
            }
        ]

        me.callParent(arguments);
    }
});

