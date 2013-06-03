Ext.define('Jites.view.toolbar.GetLocation', {
    extend: 'Ext.button.TsaButton',
    alias : 'widget.getlocation',

    scale: 'medium',

    enableToggle: true,
    toggleGroup: 'maplocation',

    iconAlign: 'top',
    iconCls: 'x-toolbar-getlocation',

    componentCls: 'x-button-maptoolbar',

    initComponent: function() {
        this.control = new OpenLayers.Control.Geolocate({
            bind: true,
            watch: false,
            geolocationOptions: {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 7000
            }
        });

        this.disabled = !Ext.supports.GeoLocation;

        this.olMap.addControl(this.control);

        //Preparo il vector
        this.vectorlayer = new OpenLayers.Layer.Vector("GeoLocation",{displayInLayerSwitcher:false});

        this.control.events.on({
            "locationupdated": this.updateLocation,
            "locationfailed": this.updateLocationError,
            scope:this
        })

        this.callParent(arguments);
    }
});