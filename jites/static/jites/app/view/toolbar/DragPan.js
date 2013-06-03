Ext.define('Jites.view.toolbar.DragPan', {
    extend: 'Ext.button.TsaButton',
    alias : 'widget.dragpan',

    scale: 'medium',

    enableToggle: true,
    toggleGroup: 'maptoolbar',

    iconAlign: 'top',
    iconCls: 'x-toolbar-pan',

    cls: 'x-button-maptoolbar',

    olControl: OpenLayers.Control.DragPan,
    olMap: null,
    pressed: true,

    initComponent: function() {

        this.control = new this.olControl();
        this.olMap.addControl(this.control);

        this.callParent(arguments);
    }
});