Ext.define('Jites.view.toolbar.NavNext', {
    extend: 'Ext.button.TsaButton',
    alias : 'widget.navnext',

    scale: 'medium',

    iconAlign: 'top',
    iconCls: 'x-toolbar-navnext',

    componentCls: 'x-button-maptoolbar',

    initComponent: function() {

        this.callParent(arguments);

    }

});