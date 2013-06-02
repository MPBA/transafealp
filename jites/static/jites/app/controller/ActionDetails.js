/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:56 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.controller.ActionDetails', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'actiondetails',
        selector: '#actiondetails'
    }],

    init: function() {
        //Loads required classes by the given names (and all their direct dependencies)
        this.control({
            '#actiondetails': {
                added:{
                    fn: this.renderActionDetails,
                    scope: this,
                    single: true
                }
            }
        });
    },

    renderActionDetails: function(){
        var me = this,
            parent = me.getActiondetails();

        //Add component to actiongraph container
        parent.add(
            Ext.create('Jites.view.ActionDetails',{
                data: {
                    success: false,
                    message: 'Select an action to view details'
                }
            })
        );

        //Enable eventlog panel
        parent.setDisabled(false);
    },
    updateActionDetails: function(action_id){
        Ext.Ajax.request({
            url: '/jites/get_action/'+action_id,
            success: function(response, opts) {
                var json = Ext.decode(response.responseText),
                    ct = Ext.getCmp('actiondetailscontainer');

                    ct.tpl.overwrite(ct.id,json);
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
                var json = Ext.decode(response.responseText),
                    ct = Ext.getCmp('actiondetailscontainer');

                    ct.tpl.overwrite(ct.id,json);
            }
        });
    }
});
