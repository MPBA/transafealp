/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/16/13
 * Time: 10:07 AM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.LogArea',{
    extend: 'Ext.container.Container',

    alias : 'widget.logarea',

    layout: 'fit',

    initComponent: function() {
        var me = this;

        me.tpl = new Ext.Template(
           '<div id="eventlogcontainer" class="container-fluid" style="overflow:auto;">',
           '<div class="row-fluid" style="height: 100%;">',
                   '<div class="span8 offset2" style="height: 100%;">',
                        '<table id="eventlogarea"  style="height: 100%;" class="table table-bordered">',
                            '<thead>',
                                '<tr>',
                                    '<th style="width:15px;">Type</th>',
                                    '<th style="width:220px;">Timestamp</th>',
                                    '<th style="width:100px;">Username</th>',
                                    '<th>Messages</th>',
                                '</tr>',
                            '</thead>',
                        '<tbody>',
                        '</tbody>',
                        '</table>',
                        '<div id="logannotation-alert"></div>',
               '</div>',
               '</div>',
           '</div>'
        );


        //TODO: implement different view mode base on Jites.DISPLAYMODE
        me.data = {
//            height: me.logareaHeight,
//            width: me.logareaWidth
        }
        me.callParent(arguments);
    }
});