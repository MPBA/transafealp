/**
 * Created with PyCharm.
 * User: droghetti
 * Date: 5/24/13
 * Time: 4:06 PM
 * To change this template use File | Settings | File Templates.
 */
Ext.define('Jites.view.FunctionPanel', {
    extend: 'Ext.panel.Panel',
    alias : 'widget.functionpanel',

    requires: [
        'GeoExt.panel.Map',
        'GeoExt.container.WmsLegend',
        'GeoExt.container.UrlLegend',
        'GeoExt.container.VectorLegend',
        'GeoExt.panel.Legend'
    ],

    layout: 'card',
    id: 'webgiswestfn',
    border: false,
    padding: '20 8 8 8',

    bodyStyle: 'background-color: #FFFFFF;border-top-width: 0px;',
    defaults: {
        border: false,
        autoScroll:true
    },

    group_id: Ext.id(),
    card_id: 0,

    initComponent: function() {

        //Aggiungo la toolbar
        this.dockedItems = [{
            xtype: 'toolbar',
            dock: 'top',
            border: false,
            baseCls: 'x-panel-body',
            margin: '0 0 20 0',
            height: 50,
            componentCls: 'x-panel-body'
//            items: btn
        }];

        this.callParent(arguments);
    },
    getCardId: function(){
        return this.card_id;
    },
    setCardId: function(){
        this.card_id = this.card_id + 1;
    },
    getNewCardId: function(){
        var old = this.card_id;
        this.setCardId();
        return old;
    },
    addNewComponent: function(obj){
        //Ottengo la toolbar
        var tb = this.down("toolbar");
        //Creo il nuovo oggetto da aggiungere
        var newFn = Ext.create(obj.classe,obj.options_obj);

        //Creo i bottoni per accedere alle rispettive card
        var options = {
            text: obj.name_btn,
            card_id: this.getNewCardId(),
            scale: 'medium',
            toggleGroup: this.group_id,
            overCls: 'x-functionpanel-button-over',
            pressedCls: 'functionpanel-button-pressed',
            focusCls: 'x-function-button-pressed',
            cls: 'x-functionpanel-button'
        };
        //Se ci sono impostate configurazione particolari faccio un merge con quelle di default definita dall'oggetto FunctionPanel
        Ext.Object.merge(options, obj.options_btn);

        //Aggiungo i componenti
        this.add(newFn);
        tb.add(options)
    }
});
