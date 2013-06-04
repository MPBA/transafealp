Ext.define('Jites.view.BaseButton', {
    extend: 'Ext.container.Container',
    alias : 'widget.fnbtn',

    style: 'margin: 5px;',

    initComponent: function() {


//        id: btnid,
//            text: text,
//            iscard: true,
//            card_id: this.getNewCardId()
        this.callParent(arguments);
    }
});
