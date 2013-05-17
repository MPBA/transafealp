/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:58 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.GenericTitle',{
    extend: 'Ext.container.Container',

    alias : 'widget.generictitle',

    initComponent: function() {
        var me = this;

        me.tpl = new Ext.Template(
                '<h1 class="text-center">{text}</h1>'
        );

        me.callParent(arguments);
    }
});

