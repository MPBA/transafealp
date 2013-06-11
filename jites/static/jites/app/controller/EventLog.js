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
        me.polling = Ext.create('Ext.direct.PollingProvider',{
            type:'polling',
            url: '/jites/poll/'+Jites.EVENTID,
            baseParams: {
                "ts_post": Jites.LASTPOLLTIMESTAMP,
                "csrfmiddlewaretoken":Ext.util.Cookies.get('csrftoken')
            },
            method: 'POST',
            interval: 5000,
            id: 'eventlog-poll-provider'
        });
        p = me.polling;

        Ext.direct.Manager.addProvider(me.polling);

        // add a handler for a 'log' event sent by the server
        Ext.direct.Manager.on('log', me.addRowToLogArea, me);

        // add a handler for exception sent by the server
        Ext.direct.Manager.on('exception', me.logError, me);

        // add a handler for update last polling timestamp
        Ext.direct.Manager.on('updatets', me.updateLogTimestamp, me);

        //Enable eventlog panel
        parent.setDisabled(false);

        //Enable log annotation event
//        $( "#logannotation-submit" ).click(function() {
//            return false;
//        });
    },
    updateLogTimestamp: function(e){
        var me = this,
            data = e.data;

        me.polling.baseParams.ts_post = data.ts
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
            '<td><span class="badge {[this.getColor(values.table_name)]}">{table_name}</span></td>',
            '<td>{ts}</td>',
            '<td>{username}</td>',
            '<td>{msg}</td>',{
                getColor: function(type){
                    var color;

                    if(type=='ev_action'){
                        color = 'badge-success'
                    } else if (type=='ev_message') {
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
        var me = this;

        $( "#logannotation-submit" ).click(function() {
            var csfr = Ext.util.Cookies.get('csrftoken'),
                content;

            content = $("#logannotation-area").val();

            //check message length
            if(content.length == 0){
                return;
            }

            //Disable button
            $("#logannotation-submit").attr("disabled", "disabled");
            $("#logannotation-cancel").attr("disabled", "disabled");

            Ext.Ajax.request({
                url: '/jites/event/'+ Jites.EVENTID +'/add/message/',
                params: {
                    content: content,
                    csrfmiddlewaretoken: csfr
                },
                success: function(response, opts) {
                    var alert_id;

                    //enable button
                    $("#logannotation-submit").removeAttr("disabled");
                    $("#logannotation-cancel").removeAttr("disabled");
                    $("#logannotation-area").val("");

                    //set alert msg
                    alert_id = me.addAlertMessage("success","Your message has been successfully saved on server.")
                },
                failure: function(response, opts) {
                    var alert_id;

                    //enable button
                    $("#logannotation-submit").removeAttr("disabled");
                    $("#logannotation-cancel").removeAttr("disabled");

                    //set alert msg
                    me.addAlertMessage("error","Unexpected error. The message is not saved");
                    console.log('server-side failure with status code ' + response.status);
                }
            });
            return false;
        });

        $( "#logannotation-cancel" ).click(function() {
            $("#logannotation-area").val("");
            return false;
        });
    },
    addAlertMessage: function(type, msg){
        var id = Ext.id(),
            tpl,
            html;
        //create template
        tpl = new Ext.Template(
            '<div id="{id}" class="alert alert-{type}">',
                '{msg}',
            '</div>'
        );

        //compile template
        html = tpl.apply({
            id: id,
            type: type,
            msg: msg
        });

        //add div to the container
        $(html).hide().appendTo("#logannotation-alert").fadeIn(1000);

        //set handler to auto-remove
        Ext.defer(function() {
            $("#"+id).fadeOut();
        }, 3000);

        return id;
    }
});