import { LightningElement, api, track } from 'lwc';
import Actions from '@salesforce/label/c.Actions';
import { hexToRgb } from 'c/utils';

export default class RelationshipInfluenceChartMember extends LightningElement {
    @track displayMenuButton = false;

    @track cellClasses =
        'slds-box slds-box_x-small slds-m-vertical_x-small stakeholder-box slds-grid slds-grid_align-spread slds-wrap';

    @track borderStyle = 'border-color: grey;';

    label = {
        Actions
    };

    @api support;

    @api influence;

    @api member;

    @api
    set borderColor(color) {
        this._borderColor = color;
        this.borderStyle = 'border-color: ' + color + ';background-color:' + hexToRgb(color, 0.01) + ';';
    }

    get borderColor() {
        return this._borderColor;
    }

    _borderColor;

    @api
    set menuItems(items) {
        this._menuItems = items;
        this.displayMenuButton = items && items.length > 0;
    }

    get menuItems() {
        return this._menuItems;
    }

    _menuItems = [];

    @api
    set canDrag(draggable) {
        if (draggable === this._canDrag) {
            return;
        }
        this._canDrag = draggable;
        this.setupCellClasses();
    }

    get canDrag() {
        return this._canDrag;
    }

    _canDrag = false;

    setupCellClasses() {
        let classes =
            'slds-box slds-box_x-small slds-m-vertical_x-small stakeholder-box slds-grid slds-grid_align-spread slds-wrap';

        if (this.canDrag) {
            classes += ' draggable';
        }
        this.cellClasses = classes;
    }

    handleMenuSelect(event) {
        let choice = event.detail.value;
        const evt = new CustomEvent('memberaction', {
            detail: { type: choice, id: this.member.id, contactId: this.member.personId }
        });

        this.dispatchEvent(evt);
    }

    handleDragStart(event) {
        event.dataTransfer.setData('memberId', this.member.id);
        event.dataTransfer.setData('support', this.support);
        event.dataTransfer.setData('influence', this.influence);
    }
}