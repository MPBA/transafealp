/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/24/13
 * Time: 4:17 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.FunctionPanelInfo', {
    extend: 'Ext.container.Container',

    layout: 'fit',
    border: false,

    alias : 'widget.functionpanel',

    initComponent: function() {
        //Template per visualizzare le informazioni introduttive
        this.tpl = new Ext.XTemplate(
            '<h4>{title}</h4>',
            '<hr/>',
            '<p class="x-information-body">',
            '<div class="x-information-body"><div style="margin-top: 5px;margin-left: 10px;">{body}</div></div>',
            '</p>'
        );

        //Metodo utilizzato per aggiornare l'area
        this.tplWriteMode = 'overwrite';

        //Associo al template i dati presenti nella configurazione del Webgis
        this.data = {
            title: 'Information',
            body: 'Some info...'
        }

        this.callParent(arguments);
    }
});
