/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/16/13
 * Time: 10:07 AM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.ActionGraphLegend',{
    extend: 'Ext.container.Container',

    alias : 'widget.actiongraphalegend',

    layout: 'fit',

    initComponent: function() {
        var me = this;

        me.tpl = new Ext.XTemplate(
            '<div class="text-center">',
                '<tpl for=".">',
                    '<div class="{style}" style="margin-right: 10px;">',
                        '<h6>{label}</h6>',
                    '</div>',
                '</tpl>',
            '</div>'
        );

        me.callParent(arguments);
    }
});