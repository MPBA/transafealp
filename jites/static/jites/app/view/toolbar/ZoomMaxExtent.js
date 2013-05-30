Ext.define('Jites.view.toolbar.ZoomMaxExtent', {
    extend: 'Ext.button.TsaButton',
    alias : 'widget.zoomextent',

    scale: 'medium',

    olControl: OpenLayers.Control.ZoomToMaxExtent,
    olMap: null,

    iconAlign: 'top',
    iconCls: 'x-toolbar-zoommax',

    componentCls: 'x-button-maptoolbar',

    initComponent: function() {

        this.control = new this.olControl(this.olInit);
        this.olMap.addControl(this.control);
        this.callParent(arguments);

    }

});