/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:56 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.controller.ActionGraph', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'actiongraph',
        selector: '#actiongraph'
    }],

    init: function() {
        //Loads required classes by the given names (and all their direct dependencies)
        this.control({
            '#actiongraph': {
                added:{
                    fn: this.renderEventLog,
                    scope: this,
                    single: true
                }
            },
            'actiongrapharea': {
                afterlayout:{
                    fn: this.initJit,
                    scope: this,
                    single: true
                }
            }
        });

    },

    renderEventLog: function(){
        var me = this,
            parent = me.getActiongraph();

        //Add component to actiongraph container
        parent.add(
            Ext.create('Jites.view.GenericTitle',{
                data: {
                    text: 'Event CP/FF/10 Frejus Italy' //TODO connect whit real event name
                }
            }),
            Ext.create('Jites.view.ActionGraphArea',{
                flex: 1
            })
        );

        //Enable eventlog panel
        parent.setDisabled(false);
    },
    initJit: function(container){
        //TODO implement ajax request to get real task tree
        var me = this,
            json = {
            id: 'node1',
            name: 'ACT1. avvisare tutti',
            data: {
                numcode: '11',
                desc: 'Test test test',
                status: 'success'
            },
            children:[{
                id: 'node2',
                name: 'ACT2',
                data: {
                    numcode: '11',
                    desc: 'Test test test',
                    status: 'success'
                },
                children:[{
                    id: 'node3',
                    name: 'ACT3 - VVFF arrive at the tunnel',
                    data: {
                        numcode: '11',
                        desc: 'Test test test',
                        status: 'success'
                    },
                    children:[{
                        id: 'node8',
                        data: {
                            numcode: '11',
                            desc: 'Test test test',
                            status: 'success'
                        },
                        name: 'ACT8 - tutti morti'
                    },{
                        id: 'node9',
                        data: {
                            numcode: '11',
                            desc: 'Test test test',
                            status: 'success'
                        },
                        name: 'ACT9'
                    },{
                        id: 'node10',
                        data: {
                            numcode: '11',
                            desc: 'Test test test',
                            status: 'success'
                        },
                        name: 'ACT10 - todo todo'
                    }]
                },{
                    id: 'node4',
                    data: {
                        numcode: '11',
                        desc: 'Test test test',
                        status: 'success'
                    },
                    name: 'ACT4'
                },{
                    id: 'node7',
                    data: {
                        numcode: '11',
                        desc: 'Test test test',
                        status: 'success'
                    },
                    name: 'ACT7 - todo todo'
                }]
            },{
                id: 'node5',
                name: 'ACT5',
                data: {
                    numcode: '11',
                    desc: 'Test test test',
                    status: 'success'
                },
                children:[{
                    id: 'node6',
                    data: {
                        numcode: '11',
                        desc: 'Test test test',
                        status: 'success'
                    },
                    name: 'ACT6'
                }]
            }]
        };

        //Create a new ST (spacetree) instance
        me.st = new $jit.ST({
            //id of container element
            injectInto: container.id,
            //set duration for the animation
            duration: 700,
            //set animation transition type
            transition: $jit.Trans.Quart.easeInOut,
            //set distance between node and its children
            levelDistance: 50,
            //set max indentention level to show
            levelsToShow: 10,

            constrained: false,

            //enable navigation, panning, zomming
            Navigation: {
                enable:true,
                panning:true
//                zooming:15
            },

            //set node and edge styles
            Node: {
                color: '#ff3',
                overridable: true,
                width: 210,
                height: 43
            },

            Label: {
                style: 'bold',
                size: 10,
                color: '#333'
            },

            //set edge (connection) styles
            Edge: {
                type: 'bezier',
                overridable: true
            },

            //This method is called on DOM label creation.
            //Use this method to add event handlers and styles to
            //your node.
            onCreateLabel: me.setLabelNode
        });

        //load json data
        me.st.loadJSON(json);

        //compute node positions and layout
        me.st.compute();

        //emulate a click on the root node to expand the graph
        me.st.onClick(me.st.root);
//
//        top.onchange = left.onchange = bottom.onchange = right.onchange = changeHandler;
//        //end
    },
    getClassName: function(node){
        var data = node.data,
            style;
        if (data.status == 'closed'){
            style = 'label label-succes'
        } else if (data.status == 'running'){
            style = 'label label-warning'
        } else if (data.status == 'tobe'){
            style = 'label'
        } else {
            style = 'label label-info'
        }

        return style;
    },
    setLabelNode: function(label,node){
        var id = node.id,
            data = node.data,
            style = label.style,
            text;

        label.id = id;
        label.innerHTML = '<h4>' + Ext.String.ellipsis(node.name, 25, true) + '</h4>';
        //TODO set style according to the event status
        label.className = "label label-warning"

        label.onclick = function(){
            //TODO register event in ActionDetails controller
//            var app = Jites.getApplication();
//            var ct = app.getController('ActionDetails');
//
//            ct.setActionDetailsToPanel();
        };
        //set label styles
        style.cursor = 'pointer';
    }
});
