/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/16/13
 * Time: 10:07 AM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.ActionDetails',{
    extend: 'Ext.container.Container',

    alias : 'widget.actiondetails',

    layout: 'fit',
    autoScroll: true,

    id: 'actiondetailscontainer',

    initComponent: function() {
        var me = this;

        me.tpl = new Ext.XTemplate(
            "<tpl if='success'>",
                '<div class="container-fluid" style="overflow:auto;">',
                    '<div class="row-fluid" style="height: 100%;">',
                        '<div class="span8 offset2" style="height: 100%;">',
                            '<div><h1>{data.action.name}</h1></div>',
                            '<ul class="inline">',
                            '<li><div> {[ this.status(values.data.action) ]} </div></li>',
                            '<tpl if="data.comment">',
                            '<li>{data.comment}</li>',
                            '</tpl>',
                            '</ul>',
                            '<hr/>',
                            '<blockquote>',
                                '<div>{data.action.description}</div>',
                                '<div>Estimated duration: <strong>{data.action.duration}</strong></div>',
                            '</blockquote>',
                            '<h3>Actors involved</h3>',
                            '<ul class="inline">',
                            '<tpl for="data.actors">',
                                '<li>',
                                    '<address style="margin-right:20px;">',
                                    '<strong>{name}</strong><br>',
                                    '{istitution}<br>',
                                    '{contact_info}<br>',
                                    '<abbr title="Phone">P:</abbr> {phone}<br/>',
                                    '<abbr title="Email">E:</abbr> <a href="mailto:{email}">{email}</a>',
                                    '</address>',
                                '</li>',
                            '</tpl>',
                            '</ul>',
                            '<h3>Attachment</h3>',
                            '<ul class="inline">',
                                '<tpl for="data.visualization">',
                                '<li>',
                                '<address style="margin-right:20px;">',
                                '<strong>{description}</strong><br>',
                                'Type: {type}<br>',
                                '{contact_info}<br>',
                                '</address>',
                                '</li>',
                                '</tpl>',
                            '</ul>',
                        '</div>',
                    '</div>',
            '   </div>',
            '<tpl else>',
                '<div class="jites-empty-area">',
                '</div>',
            '</tpl>',
            {
                status: function(action){
                    var app = Jites.getApplication(),
                        ct = app.getController('ActionGraph'),
                        style,
                        label,
                        html;
                        console.log(action);
                    style = ct.getStyleFromStatus(action);
                    label = ct.getLabelFromStatus(action);

                    html = Ext.String.format('<div class="{0}"><h6>{1}</h6></div>', style, label);
                    return html;
                }
            }
        );

        me.callParent(arguments);
    }
});