Ext.define('Jites.view.toolbar.NavPrevious', {
    extend: 'Ext.button.TsaButton',
    alias : 'widget.navprevious',

    scale: 'medium',

    iconAlign: 'top',
    iconCls: 'x-toolbar-navprevious',

    componentCls: 'x-button-maptoolbar',

    initComponent: function() {

        this.callParent(arguments);

    }

});