Ext.define('Jites.view.toolbar.ZoomIn', {
    extend: 'Ext.button.TsaButton',
    alias : 'widget.zoomin',

    scale: 'medium',

    enableToggle: true,
    toggleGroup: 'maptoolbar',

    olControl: OpenLayers.Control.ZoomBox,
    olInit: {
        alwaysZoom: true
    },
    olMap: null,

    iconAlign: 'top',
    iconCls: 'x-toolbar-zoomin',

    componentCls: 'x-button-maptoolbar',

    initComponent: function() {

        this.control = new this.olControl(this.olInit);
        this.olMap.addControl(this.control);

        this.callParent(arguments);
    }
});