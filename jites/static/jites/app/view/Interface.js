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
        bodyPadding: 10
    },

    flex: 1,

    initComponent: function() {

        this.items = [
            {
                title: 'Action graph',
                id: 'actiongraph'
            },{
                title: 'Action details',
                id: 'actiondetails'
            },{
                title: 'Webgis area',
                id: 'webgis'
            },{
                title: 'Event chronology ',
                id: 'chronology'
            }
        ]

        this.callParent(arguments);
    }
});

