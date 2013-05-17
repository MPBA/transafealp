/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/17/13
 * Time: 11:30 AM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.LogAnnotation', {
    extend: 'Ext.container.Container',
    alias : 'widget.logannotation',

    layout: 'fit',

    margin: '15 0 0 0',

    id: 'logannotation',

    initComponent: function() {
        var me = this;

        me.tpl = new Ext.Template(
            '<div  class="container-fluid">',
            '<div class="row-fluid">',
            '<div class="span8 offset2">',
            '<div class="controls controls-row">',
                    '<textarea class="span12" rows="3"></textarea>',
            '</div>',
            '<div  class="form-actions">',
                '<button id="logannotation-submit" type="submit" class="btn btn-primary">Add annotation</button>',
                '<button id="logannotation-cancel" type="button" class="btn">Cancel</button>',
            '</div>',
            '</div>',
            '</div>',
            '</div>'
        );

        //TODO: implement different view mode base on Jites.DISPLAYMODE
        me.data = {
//            height: me.logareaHeight,
//            width: me.logareaWidth
        }

        this.callParent(arguments);
    }
});