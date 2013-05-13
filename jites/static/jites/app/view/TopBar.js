/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:58 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.TopBar',{
    extend: 'Ext.container.Container',

    alias : 'widget.topbar',

    tplWriteMode: 'overwrite',

    initComponent: function() {

        this.tpl = new Ext.Template([
            '<div class="navbar navbar-fixed-top" id="id_navbar">  ',
                '<div class="navbar-inner" style="height: 95px"><div class="container-fluid"> ',
                    '<a class="brand" href="#"><img class="navbar-link" data-toggle="tooltip" title="" src="/static/img/logo_toosmall.png" data-original-title="TransafeAlp"></a> ',
                    '<div class="nav-collapse collapse">',
                        '<p class="navbar-text pull-right">' +
                            'Logged in as ',
                            '<a href="#" class="navbar-link badge badge-info">{name}</a><br/>',
                        '</p>',
                        '<p class="navbar-text pull-middle">',
                        '<img class="navbar-link" data-toggle="tooltip" title="" src="/static/img/alpine.png" data-original-title="Alpine Space">',
                        '</p>',
                '</div></div>',
            '</div>'
            ])

        this.data = {
            name: Jites.USERNAME
        }

        this.callParent(arguments);
    }
});

