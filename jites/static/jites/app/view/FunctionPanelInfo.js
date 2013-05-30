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

    autoScroll: true,

    alias : 'widget.functionpanel',

    initComponent: function() {
        //Template per visualizzare le informazioni introduttive
        this.tpl = new Ext.XTemplate(
            '<h4>{title}</h4>',
            '<hr/>',
            '<table class=""><tbody><tr>',
            '<td colspan="2;"><span class="label label-info" style="margin-bottom: 5px">Map toolbar</span></td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-pan" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Move map</td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-zoomin" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Zoomi in whit a single click, a box area or mouse wheel</td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-zoomout" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Zoom out with a click or with the mouse wheel</td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-zoommax" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Zoom to map extent</td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-navprevious" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Back to the previous displayed map</td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-navnext" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Go to the next displayed map</td>',
            '</tr>',
            '<tr>',
            '<td><div class="x-toolbar-getlocation" style="background-repeat: no-repeat;width: 25px;height: 25px;margin-rigth: 5px;"></div></td>',
            '<td>Go to the location actual (by your browser)</td>',
            '</tr>',
            '<tr>',
            '<td colspan="2;"><span class="label label-info" style="margin-bottom: 5px">Map catalog</span></td>',
            '</tr>',
            '</tbody></table>'
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
