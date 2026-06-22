import { LightningElement, api, track } from 'lwc';
import account_template_component_available_logo from '@salesforce/resourceUrl/account_template_component_available_logo';
import getComponentAvailableMdt from '@salesforce/apex/AccountPlanTemplateController.getComponentAvailableMdt';
import getTemplateSection from '@salesforce/apex/AccountPlanTemplateController.getTemplateSection';
import Components from '@salesforce/label/c.Components';
import AccountPlanTemplateMSG from '@salesforce/label/c.AccountPlanTemplateMSG';
import AvailableComponents from '@salesforce/label/c.AvailableComponents';
import NotSelectedRelatedData from '@salesforce/label/c.NotSelectedRelatedData';
import drag_drop_here from '@salesforce/label/c.drag_drop_here';
export default class AccountPlanTemplate extends LightningElement {
    @track componentListRight = [];
    @track componentListLeft = [];
    @track componentListRightForPreview = [];
    @api recordId;
    @api previewData;
    account_template_component_available_logo = account_template_component_available_logo;
    Components = Components;
    AccountPlanTemplateMSG = AccountPlanTemplateMSG;
    AvailableComponents = AvailableComponents;
    NotSelectedRelatedData = NotSelectedRelatedData;
    drag_drop_here = drag_drop_here;
    componentAvailableJson;
    @api isShowGenericDataTableComp = false;
    @api genericDataTableValues;
    dataTableValues;
    isRelatedObjectList = false;
    indexOfAvailableComponent;
    defaultValuesOfRelatedList;
    @track isdrop = false;
    isSelectRelatedData = false;
    templateSectionData;
    @track showSelectedComponent = false;
    isPreview = true;
    error;
    draggedItemData = '';
    dataJson = {};
    connectedCallback() {
        getComponentAvailableMdt()
            .then((result) => {
                this.componentListRight = [];
                let indexId = 0;
                result.forEach((ele) => {
                    if (ele.DeveloperName === 'Related_Object_List') {
                        this.isRelatedObjectList = true;
                        this.componentListRight.push({
                            id: JSON.stringify(indexId),
                            label: ele.MasterLabel,
                            value: ele.DeveloperName,
                            relatedObject: true
                        });
                    } else {
                        this.isRelatedObjectList = false;
                        this.componentListRight.push({
                            id: JSON.stringify(indexId),
                            label: ele.MasterLabel,
                            value: ele.DeveloperName,
                            relatedObject: false
                        });
                    }
                    indexId++;
                });
                this.componentListRightForPreview = [...this.componentListRight];
            })
            .catch((error) => {
                this.error = error;
            });

        if (this.recordId !== '') {
            let tempLeft = [];
            getTemplateSection({ id: this.recordId })
                .then((result) => {
                    if (result) {
                        let tempRight = this.componentListRight.filter(
                            (obj1) => !result.some((obj2) => obj2.pqcrush__Component_Name__c === obj1.value)
                        );

                        for (let index = 0; index < result.length; index++) {
                            let element = result[index];
                            if (!element.pqcrush__Is_Related_Object__c) {
                                for (let i = 0; i < this.componentListRight.length; i++) {
                                    let el = this.componentListRight[i];
                                    if (element.pqcrush__Component_Name__c === el.value) {
                                        let tempJson = {
                                            id: el.id,
                                            label: element.pqcrush__Component_Label__c,
                                            value: element.pqcrush__Component_Name__c,
                                            relatedObject: element.pqcrush__Is_Related_Object__c
                                        };
                                        tempLeft.push(tempJson);
                                    }
                                }
                            }
                        }
                        let defaultList = result
                            .filter((obj2) => obj2.pqcrush__Is_Related_Object__c === true)
                            .map((obj) => obj.pqcrush__Component_Name__c);

                        let relatedIndex;
                        this.componentListRight.forEach((element) => {
                            if (element.value === 'Related_Object_List') {
                                relatedIndex = element.id;
                            }
                        });

                        let related = false;
                        for (let index = 0; index < result.length; index++) {
                            if (result[index].pqcrush__Is_Related_Object__c) {
                                tempLeft.splice(index, 0, {
                                    id: relatedIndex,
                                    label: 'Related Object List',
                                    value: 'Related_Object_List',
                                    relatedObject: true
                                });
                                related = true;
                                this.isSelectRelatedData = true;
                                break;
                            }
                        }

                        if (related) {
                            for (let index = 0; index < tempRight.length; index++) {
                                if (tempRight[index].value === 'Related_Object_List') {
                                    tempRight.splice(index, 1);
                                }
                            }
                        }
                        this.defaultValuesOfRelatedList = [...defaultList];
                        this.componentListRight = [...tempRight];
                        this.componentListLeft = [...tempLeft];
                        this.isdrop = true;
                        this.dataTableValues = [...defaultList];
                        this.getDesicionforShowComponent();
                    }
                })
                .catch((error) => {
                    this.error = error;
                });
        }
    }

    dragRight(event) {
        if (event.target.dataset !== undefined) {
            event.dataTransfer.setData('textrightId', event.target.dataset.id);
            event.dataTransfer.setData('label', event.target.dataset.name);
            event.dataTransfer.setData('apiname', event.target.dataset.apiname);
            event.dataTransfer.setData('relatedObject', event.target.dataset.relatedobjectlist);
            event.dataTransfer.setData('typefrom', 'right');
        } else {
            event.preventDefault();
        }
    }
    dropRight(event) {
        event.preventDefault();
        if (event.dataTransfer.getData('textleftid') !== 'undefined') {
            this.componentAvailableJson = [];
            if (event.dataTransfer.getData('typefrom') === 'left') {
                let relatedObjectCheck = event.dataTransfer.getData('relatedObject') === 'false' ? false : true;
                let dragItemId = event.dataTransfer.getData('textleftid');
                let dragItemLabel = event.dataTransfer.getData('label');
                let dragItemApiName = event.dataTransfer.getData('apiname');
                this.dataJson = {
                    relatedObjectCheck: relatedObjectCheck,
                    dragItemId: dragItemId,
                    dragItemLabel: dragItemLabel,
                    dragItemApiName: dragItemApiName
                };
                this.dropLeftToRight();
            }
            this.isdrop = true;
            this.getDesicionforShowComponent();
        }
    }

    allowDropRight(event) {
        event.preventDefault();
    }

    dragLeft(event) {
        event.dataTransfer.setData('textleftid', event.target.dataset.id);
        event.dataTransfer.setData('typefrom', 'left');
        event.dataTransfer.setData('label', event.target.dataset.name);
        event.dataTransfer.setData('apiname', event.target.dataset.apiname);
        event.dataTransfer.setData('relatedObject', event.target.dataset.relatedobjectlist);
    }

    allowDropLeft(event) {
        event.preventDefault();
    }

    dropLeft(event) {
        event.preventDefault();
        if (event.dataTransfer.getData('textrightId') !== 'undefined') {
            this.componentAvailableJson = [];
            if (event.dataTransfer.getData('typefrom') === 'right') {
                let relatedObjectCheck = event.dataTransfer.getData('relatedObject') === 'false' ? false : true;
                let dragItemId = event.dataTransfer.getData('textrightId');
                let dragItemLabel = event.dataTransfer.getData('label');
                let dragItemApiName = event.dataTransfer.getData('apiname');
                this.dataJson = {
                    relatedObjectCheck: relatedObjectCheck,
                    dragItemId: dragItemId,
                    dragItemLabel: dragItemLabel,
                    dragItemApiName: dragItemApiName
                };
                this.dropRightToLeft(event);
            } else if (event.dataTransfer.getData('typefrom') === 'left') {
                const draggedItemId = event.dataTransfer.getData('textleftid');
                const newIndex = this.findNewIndex(event);
                this.reorderItems(draggedItemId, newIndex);
            }
            this.isdrop = true;
            this.indexOfAvailableComponent = 0;
            this.getDesicionforShowComponent();
        }
    }

    renderedCallback() {
        if (this.isdrop) {
            this.componentAvailableJson = [];
            this.indexOfAvailableComponent = 0;
            let componentsCompleted = this.template.querySelectorAll('.completed');
            componentsCompleted.forEach((ele) => {
                if (ele.dataset.apiname === 'Related_Object_List') {
                    if (this.dataTableValues !== undefined) {
                        this.dataTableValues.forEach((el) => {
                            if (this.componentAvailableJson.length > 0) {
                                this.componentAvailableJson.push({
                                    componentIndex: this.indexOfAvailableComponent,
                                    componentName: el,
                                    componentApiName: el,
                                    isRelatedObject: true
                                });
                                this.indexOfAvailableComponent += 1;
                            } else {
                                this.componentAvailableJson.push({
                                    componentIndex: this.indexOfAvailableComponent,
                                    componentName: el,
                                    componentApiName: el,
                                    isRelatedObject: true
                                });
                                this.indexOfAvailableComponent += 1;
                            }
                        });
                    }
                } else {
                    this.componentAvailableJson.push({
                        componentIndex: this.indexOfAvailableComponent,
                        componentName: ele.dataset.name,
                        componentApiName: ele.dataset.apiname,
                        isRelatedObject: false
                    });
                    this.indexOfAvailableComponent += 1;
                }
            });
            this.dispatchEvent(
                new CustomEvent('fromtemplate', {
                    detail: { components: this.componentAvailableJson },
                    bubbles: true,
                    composed: true
                })
            );
            this.isdrop = false;
        }

        if (this.isPreview && this.componentListRightForPreview.length !== 0 && this.previewData !== undefined) {
            if (this.previewData.templateComp !== '') {
                let templateComp = this.previewData.templateComp;
                let tempLeft = [];
                for (let index = 0; index < templateComp.length; index++) {
                    let element = templateComp[index];
                    if (!element.isRelatedObject) {
                        for (let i = 0; i < this.componentListRightForPreview.length; i++) {
                            let el = this.componentListRightForPreview[i];
                            if (element.componentApiName === el.value) {
                                let tempJson = {
                                    id: el.id,
                                    label: element.componentName,
                                    value: element.componentApiName,
                                    relatedObject: element.isRelatedObject
                                };
                                tempLeft.push(tempJson);
                            }
                        }
                    }
                }
                let tempRight = this.componentListRightForPreview.filter(
                    (obj1) => !templateComp.some((obj2) => obj2.componentApiName === obj1.value)
                );
                let defaultList = templateComp
                    .filter((obj2) => obj2.isRelatedObject === true)
                    .map((obj) => obj.componentApiName);

                let relatedIndex;
                this.componentListRightForPreview.forEach((element) => {
                    if (element.value === 'Related_Object_List') {
                        relatedIndex = element.id;
                    }
                });

                let related = false;
                for (let index = 0; index < templateComp.length; index++) {
                    if (templateComp[index].isRelatedObject) {
                        tempLeft.splice(index, 0, {
                            id: relatedIndex,
                            label: 'Related Object List',
                            value: 'Related_Object_List',
                            relatedObject: true
                        });
                        related = true;
                        this.isSelectRelatedData = true;
                        break;
                    }
                }
                if (related) {
                    for (let index = 0; index < tempRight.length; index++) {
                        if (tempRight[index].value === 'Related_Object_List') {
                            tempRight.splice(index, 1);
                        }
                    }
                }

                this.defaultValuesOfRelatedList = [...defaultList];
                this.componentListRight = [...tempRight];
                this.componentListLeft = [...tempLeft];
                this.isdrop = true;
                this.dataTableValues = [...defaultList];
                this.getDesicionforShowComponent();
                this.isPreview = false;
            }
        }
    }

    getGenericData(event) {
        this.dataTableValues = event.detail._selectedValue;
        this.defaultValuesOfRelatedList = [...this.dataTableValues];
        if (this.dataTableValues.length !== 0) {
            this.isSelectRelatedData = true;
        } else {
            this.isSelectRelatedData = false;
        }
        this.isdrop = true;
        this.renderedCallback();
    }

    findNewIndex(event) {
        const draggedOverItem = event.target.closest('.rightcls');
        const items = Array.from(this.template.querySelectorAll('.rightcls'));
        return items.indexOf(draggedOverItem);
    }

    reorderItems(draggedItemId, newIndex) {
        const draggedItem = this.componentListLeft.find((item) => item.id === draggedItemId);
        this.componentListLeft = this.componentListLeft.filter((item) => item.id !== draggedItemId);
        this.componentListLeft.splice(newIndex, 0, draggedItem);
        this.getDesicionforShowComponent();
    }
    getDesicionforShowComponent() {
        if (this.componentListLeft.length > 0) {
            this.showSelectedComponent = true;
        } else {
            this.showSelectedComponent = false;
        }
    }

    touchStartRight(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.draggedItem = event.currentTarget;
        this.draggedItemData = event.currentTarget.dataset;
        this.initialX = touch.clientX - this.draggedItem.getBoundingClientRect().left;
        this.initialY = touch.clientY - this.draggedItem.getBoundingClientRect().top;
        this.draggedItem.style.left = `${touch.clientX - this.initialX}px`;
        this.draggedItem.style.top = `${touch.clientY - this.initialY}px`;
    }

    touchMoveContainerRight(event) {
        event.preventDefault();
        const touch = event.touches[0];
        if (this.draggedItem) {
            this.draggedItem.style.position = 'absolute';
            this.draggedItem.style.width = 'auto';
            this.draggedItem.style.zIndex = 1000;
            this.draggedItem.style.left = `${touch.clientX - this.initialX}px`;
            this.draggedItem.style.top = `${touch.clientY - this.initialY}px`;
        }
    }

    touchEndContainerRight(event) {
        event.preventDefault();
        if (this.draggedItem) {
            this.draggedItem.style.zIndex = 100;
            this.draggedItem.style.position = 'initial';
            const containerRect = this.template.querySelector('.flex-container').getBoundingClientRect();
            const dropX = event.changedTouches[0].clientX - containerRect.left;
            const dropY = event.changedTouches[0].clientY - containerRect.top;
            // Check if the drop coordinates are within the container's boundaries
            if (dropX >= 0 && dropY >= 0 && dropX <= containerRect.width && dropY <= containerRect.height) {
                let relatedObjectCheck = this.draggedItemData.relatedobjectlist === 'false' ? false : true;
                let dragItemId = this.draggedItemData.id;
                let dragItemLabel = this.draggedItemData.name;
                let dragItemApiName = this.draggedItemData.apiname;
                this.dataJson = {
                    relatedObjectCheck: relatedObjectCheck,
                    dragItemId: dragItemId,
                    dragItemLabel: dragItemLabel,
                    dragItemApiName: dragItemApiName
                };
                this.dropRightToLeft(event);
                this.isdrop = true;
                this.indexOfAvailableComponent = 0;
                this.getDesicionforShowComponent();
            }
        }
        this.draggedItem = null;
    }

    touchStartLeft(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.draggedItem = event.currentTarget;
        this.draggedItemData = event.currentTarget.dataset;
        this.initialX = touch.clientX - this.draggedItem.getBoundingClientRect().left;
        this.initialY = touch.clientY - this.draggedItem.getBoundingClientRect().top;
        this.draggedItem.style.left = `${touch.clientX - this.initialX}px`;
        this.draggedItem.style.top = `${touch.clientY - this.initialY}px`;
    }

    touchMoveContainerLeft(event) {
        event.preventDefault();
        const touch = event.touches[0];
        if (this.draggedItem) {
            this.draggedItem.style.position = 'absolute';
            this.draggedItem.style.width = 'auto';
            this.draggedItem.style.zIndex = 1000;
            this.draggedItem.style.left = `${touch.clientX - this.initialX}px`;
            this.draggedItem.style.top = `${touch.clientY - this.initialY}px`;
        }
    }

    touchEndContainerLeft(event) {
        event.preventDefault();
        if (this.draggedItem) {
            this.draggedItem.style.position = 'initial';
            this.draggedItem.style.zIndex = 100;
            const containerRect = this.template.querySelector('.flex-div').getBoundingClientRect();
            const containerRectLeft = this.template.querySelector('.flex-container').getBoundingClientRect();
            const dropX = event.changedTouches[0].clientX - containerRect.left;
            const dropY = event.changedTouches[0].clientY - containerRect.top;
            const dropXLeft = event.changedTouches[0].clientX - containerRectLeft.left;
            const dropYLeft = event.changedTouches[0].clientY - containerRectLeft.top;
            let temp1 = dropX >= 0 && dropY >= 0 && dropX <= containerRect.width && dropY <= containerRect.height;
            let temp2 =
                dropXLeft >= 0 &&
                dropYLeft >= 0 &&
                dropXLeft <= containerRectLeft.width &&
                dropYLeft <= containerRectLeft.height;
            // Check if the drop coordinates are within the container's boundaries
            if (temp1) {
                this.componentAvailableJson = [];
                let relatedObjectCheck = this.draggedItemData.relatedobjectlist === 'false' ? false : true;
                let dragItemId = this.draggedItemData.id;
                let dragItemLabel = this.draggedItemData.name;
                let dragItemApiName = this.draggedItemData.apiname;
                this.dataJson = {
                    relatedObjectCheck: relatedObjectCheck,
                    dragItemId: dragItemId,
                    dragItemLabel: dragItemLabel,
                    dragItemApiName: dragItemApiName
                };
                this.dropLeftToRight();
            }
            if (temp2) {
                const draggedItemId = this.draggedItemData.id;
                const newIndex = this.findNewIndex(event);
                this.reorderItems(draggedItemId, newIndex);
            }
            this.isdrop = true;
            this.indexOfAvailableComponent = 0;
            this.getDesicionforShowComponent();
        }
        this.draggedItem = null;
    }

    dropRightToLeft(event) {
        if (this.componentListLeft.length > 0) {
            let relatedObjectCheck = this.dataJson.relatedObjectCheck;
            const draggedItemId = this.dataJson.dragItemId;
            this.componentListLeft = [
                ...this.componentListLeft,
                {
                    id: this.dataJson.dragItemId,
                    label: this.dataJson.dragItemLabel,
                    value: this.dataJson.dragItemApiName,
                    relatedObject: relatedObjectCheck
                }
            ];

            let idindex;
            for (let i = 0; i < this.componentListRight.length; i++) {
                if (this.componentListRight[i].id === this.dataJson.dragItemId) {
                    idindex = i;
                }
            }
            this.componentListRight.splice(idindex, 1);
            const newIndex = this.findNewIndex(event);
            this.reorderItems(draggedItemId, newIndex);
        } else {
            let relatedObjectCheck = this.dataJson.relatedObjectCheck;
            this.componentListLeft = [
                ...this.componentListLeft,
                {
                    id: this.dataJson.dragItemId,
                    label: this.dataJson.dragItemLabel,
                    value: this.dataJson.dragItemApiName,
                    relatedObject: relatedObjectCheck
                }
            ];
            let idindex;
            for (let i = 0; i < this.componentListRight.length; i++) {
                if (this.componentListRight[i].id === this.dataJson.dragItemId) {
                    idindex = i;
                }
            }
            this.componentListRight.splice(idindex, 1);
        }
    }

    dropLeftToRight() {
        let relatedObjectCheck = this.dataJson.relatedObjectCheck;
        if (relatedObjectCheck) {
            this.defaultValuesOfRelatedList = [];
            this.dataTableValues = [];
            this.isSelectRelatedData = false;
        }
        const newComponent = {
            id: this.dataJson.dragItemId,
            label: this.dataJson.dragItemLabel,
            value: this.dataJson.dragItemApiName,
            relatedObject: relatedObjectCheck
        };
        if (this.componentListRight.length > 0) {
            this.componentListRight.splice(this.dataJson.dragItemId, 0, newComponent);
        } else {
            this.componentListRight = [...this.componentListRight, newComponent];
        }
        let idindex;
        for (let i = 0; i < this.componentListLeft.length; i++) {
            if (this.componentListLeft[i].id === this.dataJson.dragItemId) {
                idindex = i;
            }
        }
        this.componentListLeft.splice(idindex, 1);
    }
}