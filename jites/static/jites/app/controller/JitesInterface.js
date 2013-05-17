/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:56 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.controller.JitesInterface', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'viewport',
        selector: 'viewport'
    },{
        ref: 'content',
        selector: 'viewport > container[id=content]'
    }],

    init: function() {

        this.control({
            'viewport > container[id=content]': {
                afterlayout:{
                    fn: this.renderInterface,
                    scope: this,
                    single: true
                }
            }
        });

    },

    renderInterface: function(){
        var me = this,
            content = me.getContent(),
            baseInterface;

        //Select correct display mode and create a Ext.panel.Panel instance
        try {

            if(Jites.DISPLAYMODE == 'single'){
                Jites.DISPLAYMODE = 'single';
                baseInterface = Ext.create('Jites.view.Interface',{
                    componentSize: me.getComponentSize(content,Jites.DISPLAYMODE)
                });
            } else if (Jites.DISPLAYMODE == 'extended') {
                Jites.DISPLAYMODE = 'extended';
                baseInterface = Ext.create('Jites.view.InterfaceExtended',{
                    componentSize: me.getComponentSize(content,Jites.DISPLAYMODE)
                });
            }  else {
                throw 'Jites.DISPLAYMODE not recognized';
            }

        } catch (err){
            console.log(err);
        }

        //Add interface to viewport (and rendered)
        content.add(
            baseInterface
        )

    },
    getComponentSize: function(content,mode){
        try {

            var me = this,
                topbar = content.previousNode('container'),
                viewport = this.getViewport(),
                result;

            if(mode == 'single'){
                // In single mode the size is taken directly from content area
                result = {
                    w: content.getSize().width,
                    h: content.getSize().height
                }
                return result;
            } else if(mode == 'extended'){
                // In extended mode (4 monitor) is taken the size of the viewport.
                // For the first line (table layout) i remove the size of the toolbar
                // so as to obtain a grid which is aligned properly to the edge of the monitor
                result = {
                    wRow1: (viewport.getSize().width / 2),
                    hRow1: (viewport.getSize().height / 2) - topbar.getHeight(),
                    hRow2: viewport.getSize().height / 2
                }
                return result;
            } else {
                throw 'DISPLAYMODE not recognized'
            }

        } catch (err){
            console.log(err);
        }
    }
});
