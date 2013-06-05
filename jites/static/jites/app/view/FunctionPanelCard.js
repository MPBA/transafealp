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

    header: false,
    border: false,
    layout: 'card',
    items: [{
        id: 'functionpanelcardbtnarea',
        xtype: 'panel',
        border: false,
        autoScroll: false,
        layout: 'fit'

    }],

    initComponent: function() {

        this.callParent(arguments);
    }
});