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

        //Set other path
        Ext.Loader.setPath('GeoExt', '/static/jites/GeoExt');

        //Loading configuration via AJAX request
        Jites.DISPLAYMODE = displaymode;
        Jites.USERNAME = username;
        Jites.EVENTID = event_id;


        Ext.Ajax.request({
            url: 'jites/get_event/'+Jites.EVENTID,
            success: function(response, opts) {
                var r = Ext.decode(response.responseText);
                Jites.event = r.data;

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

                $(".loading").delay(1000) /*to remove*/
                $(".loading").hide();

                $("#id_navbar").fadeIn("slow"); /*show the navbar*/
                $("#id_containerfluid").fadeIn("slow");/*show the container*/
                $("#footer").fadeIn("slow"); /*show the footer*/

            },
            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
            }
        });

    },

    controllers: [
        'JitesInterface',
        'EventLog',
        'ActionGraph',
        'Webgis',
        'WebgisToolbar'
    ]

});