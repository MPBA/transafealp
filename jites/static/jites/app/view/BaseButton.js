Ext.define('Jites.view.BaseButton', {
    extend: 'Ext.button.Button',
    alias : 'widget.fnbtn',

    scale: 'medium',

    componentCls: 'x-base-button',

    height: '55',

    style: 'margin: 5px;',

    initComponent: function() {


        this.callParent(arguments);
    }
});
