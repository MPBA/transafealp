/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 6/3/13
 * Time: 12:31 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.FunctionPanelCard', {
    extend: 'Ext.container.Container',

    id: 'functionpanelcardarea',

    alias : 'widget.functionpanelcardarea',

    autoScroll:false,
    header: false,
    border: false,
    layout: 'card',
    items: [{
        id: 'functionpanelcardbtnarea',
        border: false,

        layout: {
            type: 'table',
            // The total column count must be specified here
            columns: 1,
            tableAttrs: {
                style: {
                    width: '100%'
                }
            },
            tdAttrs:{
                style: {
                    width: '50%'
                }
            }
        },

        defaults: {
            // applied to each contained panel
            bodyStyle: 'padding:20px',
            border: false
        }

    }],

    initComponent: function() {


        this.callParent(arguments);
    }
});