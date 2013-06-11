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
                    fn: this.renderActionGraph,
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

    renderActionGraph: function(){
        var me = this,
            parent = me.getActiongraph();

        //Add component to actiongraph container
        parent.add(
            Ext.create('Jites.view.GenericTitle',{
                data: {
                    text: Ext.String.format('Event {0} [{1} -> {2}]',Jites.event.event_name, Jites.event.category_name,
                        Jites.event.subcategory_name )
                }
            }),
            Ext.create('Jites.view.ActionGraphLegend',{
                data: me.getAvailableStatus()
            }),
            Ext.create('Jites.view.ActionGraphArea',{
                flex: 1
            })
        );

        //Enable eventlog panel
        parent.setDisabled(false);
    },
    initJit: function(container){
        var me = this,
        parent = me.getActiongraph(),
        offset = ((parent.getWidth()/2)-120);

        parent.setDisabled(true);

        //Create a new ST (spacetree) instance
        me.st = new $jit.ST({
            //id of container element
            injectInto: container.id,
//            set alignment
//            align: 'left',
            offsetX: offset,
            //set duration for the animation
            duration: 700,
            //set animation transition type
            transition: $jit.Trans.Quart.easeInOut,
            //set distance between node and its children
            levelDistance: 50,
            //set max indentention level to show
            levelsToShow: 30,

            constrained: false,

            //enable navigation, panning, zomming
            Navigation: {
                enable:true,
                panning:true
//                zooming:15
            },

            //set node and edge styles
            Node: {
                color: '#FFFFFF',
                overridable: true,
                width:  Jites.ACTIONGRAPHLABELWIDHT,
                height: 43
            },

            Label: {
                style: 'bold',
                size: 10,
                color: '#FFFFFF'
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


        Ext.Ajax.request({
            url: 'jites/tree/to/json/'+Jites.EVENTID,
            success: function(response, opts) {
                var json = Ext.decode(response.responseText);

                //load json data
                me.st.loadJSON(json);

                //compute node positions and layout
                me.st.compute();

                //emulate a click on the root node to expand the graph
                me.st.onClick(me.st.root);

                //Enable eventlog panel
                parent.setDisabled(false);
            },
            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
            }
        });
//
//        top.onchange = left.onchange = bottom.onchange = right.onchange = changeHandler;
//        //end
    },
    getStyleFromStatus: function(data){
        var me = this,
            status = me.getAvailableStatus(),
            pluck = Ext.Array.pluck(status,'id'),
            index = Ext.Array.indexOf(pluck,data.status),
            style;

        style = status[index] ? status[index]['style'] : 'label label-inverse';

        return style;
    },
    getBtnFromStatus: function(data){
        var me = this,
            status = me.getAvailableStatus(),
            pluck = Ext.Array.pluck(status,'id'),
            index = Ext.Array.indexOf(pluck,data.status),
            style;

        style = status[index] ? status[index]['btn'] : 'btn btn-inverse';

        return style;
    },
    getLabelFromStatus: function(data){
        var me = this,
            status = me.getAvailableStatus(),
            pluck = Ext.Array.pluck(status,'id'),
            index = Ext.Array.indexOf(pluck,data.status),
            label;

        label = status[index] ? status[index]['label'] : 'Status is not available';

        return label;
    },
    getAvailableStatus: function(){
        var status = new Array();

        status.push({
            'id': 'non executable',
            'label': 'Non executable',
            'style': 'label',
            'btn': 'btn'
        },{
            'id': 'executable',
            'label': 'Executable',
            'style': 'label label-info',
            'btn': 'btn btn-info'
        },{
            'id': 'running',
            'label': 'Running',
            'style': 'label label-warning',
            'btn': 'btn btn-warning'
        },{
            'id': 'terminated (success)',
            'label': 'Terminated (success)',
            'style': 'label label-success',
            'btn': 'btn btn-success'
        },{
            'id': 'terminated (not needed)',
            'label': 'Terminated (not needed)',
            'style': 'label label-not-needed',
            'btn': 'btn btn-not-needed'
        },{
            'id': 'terminated (failed)',
            'label': 'Terminated (failed)',
            'style': 'label label-important',
            'btn': 'btn btn-danger'
        });
        return status;
    },
    setLabelNode: function(label,node){
        var id = node.id,
            data = node.data,
            style = label.style,
            app = Jites.getApplication(),
            ct = app.getController('ActionGraph'),
            text;

        label.id = id;
//        label.innerHTML = '<div style="margin: 5px; height: 35px;">' + Ext.String.ellipsis(node.name, 35, true) + '</div>';
        label.innerHTML = '<div style="margin: 5px; height: 35px; white-space: normal;">' +  Ext.String.ellipsis(node.name,75, true) + '</div>';
        //TODO set style according to the event status
        label.className = ct.getStyleFromStatus(data);

        label.ondblclick = function(){
            //TODO register event in ActionDetails controller
            var app = Jites.getApplication(),
                ct = app.getController('ActionDetails'),
                node_id;

            node_id = node.id.split('node')[1];
            ct.updateActionDetails(node_id);
        };
        //set label styles
        style.cursor = 'pointer';
        style.width =  Jites.ACTIONGRAPHLABELWIDHT + "px";
    }
});
