/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/16/13
 * Time: 10:07 AM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.ActionGraphCloseButton',{
    extend: 'Ext.container.Container',

    alias : 'widget.actiongraphclosebutton',

    layout: 'fit',

    margin: '10 10 10 10',

    initComponent: function() {
        var me = this,
            bodyWidth = Ext.getBody().getWidth(),
            position;

        me.tpl = new Ext.XTemplate(
            '<div class="text-center">',
                '<a  id="action-graph-close-event" href="#close-event-modal" role="button" {disabled} class="btn btn-large btn-block btn-primary" data-toggle="modal">CLOSE EVENT</a>',
            '</div>',
            '<div id="close-event-modal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" {test} {position}>',
                '<div class="modal-header">',
                    '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
                    '<h3 id="myModalLabel">{event}</h3>',
                '</div>',
                '<div class="modal-body">',
                    '<p>One fine body…</p>',
                '</div>',
                '<div class="modal-footer">',
                    '<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>',
                    '<button id="close-event-modal-confirm" class="btn btn-primary btn-danger">Save changes</button>',
                '</div>',
            '</div>'
        );


        me.data = {
            event: Ext.String.format('Event {0} [{1}]', Jites.event.event_name, Jites.event.subcategory_name )
        };

        if (Jites.DISPLAYMODE == 'extended'){
            position = (bodyWidth / 4);
            me.data.position = Ext.String.format('style="left: {0}px;"',position);
        }
        if (!Jites.CANEDIT || !Jites.IS_OPEN) {
            me.data.disabled = 'style="display: none;"'
        }

        me.callParent(arguments);
    }
});