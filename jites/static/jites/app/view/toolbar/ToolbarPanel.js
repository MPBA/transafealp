Ext.define('Jites.view.toolbar.ToolbarPanel', {
    extend: 'Ext.container.Container',
    alias : 'widget.toolbarpanel',

    border: false,

    renderTo: Ext.getBody(),

    closable: false,
    preventHeader: true,
    resizable: false,
    shadow: false,
    autoShow: true,
    floating: true,

    id: 'toolbarpanel',

    baseCls: 'x-toolbarpanel',

    //width: null,
    height: 50 ,

    layout: {
        type: 'hbox',
        align: 'stretchmax',
        defaultMargins: {top: 10, right: 0, bottom: 0, left: 10}
    },

    initComponent: function() {
        this.width = (this.items.length * 70);
        var m = Ext.get('webgiscenter');
        this.setPosition(m.getX(), m.getY());
        this.callParent(arguments);
    }
});

