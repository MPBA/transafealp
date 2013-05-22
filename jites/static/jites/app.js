/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 2:04 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.application({
    name: 'Jites',

    appFolder: '/static/jites/app',

    launch: function() {
        //Require library
        Ext.require('Ext.util.Cookies');

        //Loading configuration via AJAX request
        //TODO to be implemented
        Jites.DISPLAYMODE = displaymode;
        Jites.USERNAME = username;

        //Create base viewport
        Ext.create('Ext.container.Viewport', {
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            border: false,
            items: [{
                xtype: 'container',
                renderTo: 'id_navbar',
                height: 95
            },{
                xtype: 'container',
                id: 'content',
                layout: 'fit',
                flex: 1
            }]
        });

    },

    controllers: [
        'JitesInterface',
        'EventLog',
        'ActionGraph'
    ]

});