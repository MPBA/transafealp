/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/8/13
 * Time: 5:56 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.controller.EventLog', {
    extend: 'Ext.app.Controller',

    refs: [{
        ref: 'eventlog',
        selector: '#eventlog'
    }],

    init: function() {
        //Loads required classes by the given names (and all their direct dependencies)
        this.control({
            '#eventlog': {
                added:{
                    fn: this.renderEventLog,
                    scope: this,
                    single: true
                }
            },
            'logarea': {
                resize:{
                    fn: this.updateMaxHeight,
                    scope: this
                }
            },
            'logannotation': {
                afterrender:{
                    fn: this.logAnnotationEvent,
                    scope: this
                }
            }
        });

    },

    renderEventLog: function(){
        var me = this,
            parent = me.getEventlog(),
            polling;

        //Add component to eventlog container
        parent.add(
            Ext.create('Jites.view.GenericTitle',{
                data: {
                    text: 'Event chronology and emergency notes'
                }
            }),
            Ext.create('Jites.view.LogArea',{
                flex: 3
            }),
            Ext.create('Jites.view.LogAnnotation',{
                height: 180
            })
        );

        //Setting up the PollingProvider (~5 sec). NB> autoconnect to the server-side and begin the polling process.
        polling = new Ext.direct.PollingProvider({
            type:'polling',
            url: '/jites/poll',
            interval: 5000000,
            id: 'eventlog-poll-provider'
        });
        Ext.direct.Manager.addProvider(polling);

        // add a handler for a 'log' event sent by the server
        Ext.direct.Manager.on('log', me.addRowToLogArea, me);

        // add a handler for exception sent by the server
        Ext.direct.Manager.on('exception', me.logError, me);

        //Enable eventlog panel
        parent.setDisabled(false);

        //Enable log annotation event
        $( "#logannotation-submit" ).click(function() {
            console.log("dio cane")
            return false;
        });
    },
    addRowToLogArea: function(e){
        var me = this,
            table = me.getEventLogArea(),
            tableBody = table.dom.getElementsByTagName('tbody')[0],
            container = me.getEventLogContainer(),
            data = e.data,
            newRow,
            tpl;

        //Base template to visualize new log event
        tpl = new Ext.XTemplate(
            '<td><span class="badge {[this.getColor(values.type)]}">{type}</span></td>',
            '<td>{ts}</td>',
            '<td>{username}</td>',
            '<td>{msg}</td>',{
                getColor: function(type){
                    var color;

                    if(type=='SYSTEM'){
                        color = 'badge-success'
                    } else if (type=='TASK') {
                        color = 'badge-warning'
                    } else {
                        color = ''
                    }

                    return color;
                }
            }
        );

        //Create new row in EventLogArea at last position (-1) in tbody dom element
        newRow = tableBody.insertRow(-1);

        //Compile template and add html to the new row
        newRow.innerHTML = tpl.apply(data);

        //Go to the last row in the event log container
        container.dom.scrollTop = container.dom.scrollHeight;

    },
    logError: function(e){
        var me = this,
            table = me.getEventLogArea(),
            tableBody = table.dom.getElementsByTagName('tbody')[0],
            newRow,
            tpl;

        //Base template to visualize new log event
        tpl = new Ext.XTemplate(
            '<td><span class="badge badge-important">{type}</span></td>',
            '<td>{ts}</td>',
            '<td>{username}</td>',
            '<td>{msg}</td>'
        );

        //Create new row in EventLogArea at last position (-1) in tbody dom element
        newRow = tableBody.insertRow(-1);

        //Compile template and add html to the new row
        newRow.innerHTML = tpl.apply({
            type: 'ERROR',
            ts: '-',
            username: '-',
            msg: e.message
        });
    },
    getEventLogArea: function(){
        var area = Ext.get("eventlogarea");
        return area;
    },
    getEventLogContainer: function(){
        var ct = Ext.get("eventlogcontainer");
        return ct;
    },
    updateMaxHeight: function(p){
        var me = this,
            ct,

        ct = me.getEventLogContainer();
        ct.setStyle('max-height', p.getHeight() + 'px');
    },
    logAnnotationEvent: function(){
        $( "#logannotation-submit" ).click(function() {
            Ext.Ajax.request({
                url: 'jites/emergency/log/annotation',
                success: function(response, opts) {

                    console.dir(response);
                },
                failure: function(response, opts) {
                    console.log('server-side failure with status code ' + response.status);
                }
            });
            return false;
        });
        $( "#logannotation-cancel" ).click(function() {

            return false;
        });
    }
});
