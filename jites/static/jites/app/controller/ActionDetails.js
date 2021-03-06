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

    requires: [
        'Ext.window.MessageBox'
    ],

    init: function() {
        //Loads required classes by the given names (and all their direct dependencies)
        this.control({
            '#actiondetails': {
                added:{
                    fn: this.renderActionDetails,
                    scope: this,
                    single: true
                }
            },
            'actiondetails': {
                afterrender:{
                    fn: this.addEventToStatusButton,
                    scope: this
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
        if(Jites.DISPLAYMODE == 'single'){
            var win = Ext.getCmp('actiondetails');
            win.show();
        }

        var el = Ext.get(actiondetailscontainer);
        el.mask('<h5>Update action status in progress</h5>');

        Ext.Ajax.request({
            url: '/jites/get_action/'+action_id,
            success: function(response, opts) {
                var json = Ext.decode(response.responseText),
                    ct = Ext.getCmp('actiondetailscontainer');

                ct.tpl.overwrite(ct.id,json);
                el.unmask();
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
                el.unmask();
                var r = Ext.decode(response.responseText);
                Ext.MessageBox.show({
                    title: 'Internal error',
                    msg: r.message,
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.WARNING
                });
            }
        });
    },
    addEventToStatusButton: function(container){
        Ext.get(container.id).on('click', function(event, target) {
            var content = $('#actiondetails-set-comment-area').val(),
            status = target.getAttribute('status'),
            action_id = target.getAttribute('action_id'),
            csfr = Ext.util.Cookies.get('csrftoken'),
            el = Ext.get(actiondetailscontainer);

            el.mask('<h5>Update action status in progress</h5>');



            Ext.Ajax.request({
                url: '/jites/update_action_status/'+action_id,
                params: {
                    content: content,
                    csrfmiddlewaretoken: csfr,
                    status: status
                },
                success: function(response, opts) {
                    var json = Ext.decode(response.responseText),
                    ct = Ext.getCmp('actiondetailscontainer'),
                    app = Jites.getApplication(),
                    controller = app.getController('ActionGraph');

                    //Cicle for update action status on actiongraph
                    Ext.Array.each(json.updated_actions,function(el){
                        var node = Ext.get('node'+el.row_id);
                        var status = controller.getStyleFromStatus(el);

                        node.dom.className = status;
                    });

                    ct.tpl.overwrite(ct.id,json.action_detail);
                    el.unmask();

                },
                failure: function(response, opts) {
                    console.log('server-side failure with status code ' + response.status);
                    el.unmask();
                    var r = Ext.decode(response.responseText);
                    Ext.MessageBox.show({
                        title: 'Internal error',
                        msg: r.message,
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.WARNING
                    });
                }
            });
        }, null, {delegate: 'button'});
    }
});
