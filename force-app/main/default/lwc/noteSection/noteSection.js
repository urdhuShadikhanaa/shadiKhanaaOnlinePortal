import { LightningElement, api, track } from 'lwc';
import createJson from '@salesforce/apex/ShowNoteSection.createJson';
import updateNoteSection from '@salesforce/apex/ShowNoteSection.updateNoteSection';
import insertNoteSection from '@salesforce/apex/ShowNoteSection.insertNoteSection';
import Id from '@salesforce/user/Id';
import No_Data_Available from '@salesforce/label/c.No_Data_Available';
import Save from '@salesforce/label/c.Save';
import Cancel from '@salesforce/label/c.Cancel';
export default class NoteSection extends LightningElement {
    currentUser = Id;
    labels = {
        No_Data_Available,
        Cancel,
        Save
    };
    @api templateids;
    @track showSpinner = false;
    fieldValue = ' ';
    fieldLabel;
    required;
    fieldLength = 32000;
    visibleLines = 3;
    @api recordId;
    validity;
    errorMessage;
    flag = true;
    notesId;
    avaiableUser = false;
    EmptyNotes = false;
    disbaleBtn = true;
    allowedFormats = [
        'font',
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'indent',
        'align',
        'link',
        'clean',
        'header',
        'color',
        'background',
        'code',
        'code-block',
        'script',
        'blockquote',
        'direction'
    ];
    ShowNotesArray = [];
    error = '';
    connectedCallback() {
        var tempAr = new Set();
        this.validity = true;
        document.documentElement.style.setProperty('--rta-visiblelines', this.visibleLines * 2 + 'em');
        createJson({ recordId: this.recordId, templateids: this.templateids })
            .then((result) => {
                let data;
                result.forEach((ele) => {
                    let uservalue = ele.pqcrush__User__r.Name;
                    let modifiedDate = new Date(ele.LastModifiedDate);
                    let options = {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    };
                    let formattedDate = modifiedDate.toLocaleString('en-US', options);

                    data = {
                        message: ele.pqcrush__Rich_Text_Area__c,
                        username: uservalue,
                        notesId: ele.Id,
                        userid: ele.pqcrush__User__c,
                        dateValue: formattedDate,
                        classValue: 'storeNotes',
                        over: '{over}',
                        out: '{out}'
                    };
                    tempAr.add(data);
                });
                let listValue = [];
                tempAr.forEach((element) => {
                    listValue.push(element);
                });
                let i = 0;
                let jsonValue;
                for (let j = 0; j < listValue.length; j++) {
                    i++;
                    if (listValue[j].userid === this.currentUser) {
                        jsonValue = listValue[j];
                        this.avaiableUser = true;
                        break;
                    }
                }

                if (this.avaiableUser === true && listValue.length > 1) {
                    listValue.splice(i, 1);
                    listValue.splice(0, 0, jsonValue);
                    listValue[0].classValue = 'tempstoreNotes';
                    listValue[0].over = this.showEdit;
                    listValue[0].out = this.disableEdit;
                } else if (listValue.length === 1 && this.avaiableUser === true) {
                    listValue[0].classValue = 'tempstoreNotes';
                }
                this.ShowNotesArray = [...listValue];

                if (this.ShowNotesArray.length === 0) {
                    this.EmptyNotes = true;
                }
            })
            .catch((err) => {
                this.error = err;
            });
    }
    renderedCallback() {
        this.ShowNotesArray.forEach((element) => {
            if (element.userid === this.currentUser && this.flag === true) {
                let richTextArea = this.template.querySelector('.richText');
                let notesArea = this.template.querySelector('.notes');
                richTextArea.style.display = 'none';
                notesArea.style.height = 'calc(100vh - 20px )';
                this.flag = false;
            }
        });
        let style1 = document.createElement('style');
        style1.innerText = '.ql-image {display: none;} ';
        this.template.querySelector('lightning-input-rich-text').appendChild(style1);
        let styleAttachment = document.createElement('style');
        styleAttachment.innerText = '.ql-link {display: none;} ';
        this.template.querySelector('lightning-input-rich-text').appendChild(styleAttachment);
        let stylefont = document.createElement('style');
        stylefont.innerText = '.slds-rich-text-editor__select {display: none;} ';
        this.template.querySelector('lightning-input-rich-text').appendChild(stylefont);
        if (this.avaiableUser !== true) {
            let styleheight = document.createElement('style');
            styleheight.innerText = '.ql-editor { height: 100px;} ';
            this.template.querySelector('lightning-input-rich-text').appendChild(styleheight);
        }
    }
    handleChange(event) {
        if (event.target.value.length > this.fieldLength) {
            this.validity = false;
            this.errorMessage = 'You have exceeded the max length';
        } else {
            this.validity = true;
            this.fieldValue = event.target.value;
        }
        let savenotes = this.template.querySelector('.mybtn');
        if (this.fieldValue === '') {
            this.disbaleBtn = true;
            savenotes.style.backgroundColor = '#c9c7c5';
        } else {
            this.disbaleBtn = false;
            savenotes.style.backgroundColor = '#1b68ff';
        }
    }
    showEdit() {
        this.template.querySelector('.editButton').style.display = 'block';
        this.template.querySelector('.tempstoreNotes').style.backgroundColor = '#dddbda52';
    }
    disableEdit() {
        this.template.querySelector('.editButton').style.display = 'none';
        this.template.querySelector('.tempstoreNotes').style.backgroundColor = '#dddbda00';
    }
    showDataRichText(e) {
        this.notesId = e.currentTarget.dataset.ids;
        let notes = this.template.querySelector('.notes');
        let richtext = this.template.querySelector('.richText');
        let cancelbtn = this.template.querySelector('.mybtncancel');
        notes.style.display = 'none';
        richtext.style.display = 'block';
        richtext.style.height = '411px';
        cancelbtn.style.display = 'block';
        let textheight = document.createElement('style');
        textheight.innerText = '.slds-rich-text-editor { height: 350px;} .ql-editor { height: 240px;}';
        this.template.querySelector('lightning-input-rich-text').appendChild(textheight);
        this.fieldValue = this.ShowNotesArray[0].message;
    }

    cancelNotes() {
        let notes = this.template.querySelector('.notes');
        let cancelbtn = this.template.querySelector('.mybtncancel');
        let richtext = this.template.querySelector('.richText');
        notes.style.display = 'block';
        richtext.style.display = 'none';
        cancelbtn.style.display = 'none';
        let textheight = document.createElement('style');
        textheight.innerText = '.slds-rich-text-editor { height: auto;} ';
        this.template.querySelector('lightning-input-rich-text').appendChild(textheight);
        this.fieldValue = '';
    }
    SaveNotes() {
        this.showSpinner = true;
        let msg = this.fieldValue;
        if (this.ShowNotesArray.length === 0) {
            insertNoteSection({
                accountPlan: this.recordId,
                accountPlanTemp: this.templateids,
                message: msg,
                currentUserdata: this.currentUser
            })
                .then((result) => {
                    let uservalue = result[0].pqcrush__User__r.Name;
                    let modifiedDate = new Date(result[0].LastModifiedDate);
                    let options = {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    };
                    let formattedDate = modifiedDate.toLocaleString('en-US', options);
                    let tempArr = [];
                    let data = {
                        message: result[0].pqcrush__Rich_Text_Area__c,
                        username: uservalue,
                        notesId: result[0].Id,
                        userid: result[0].pqcrush__User__c,
                        dateValue: formattedDate,
                        classValue: 'tempstoreNotes',
                        over: this.showEdit,
                        out: this.disableEdit
                    };
                    tempArr.push(data);
                    this.ShowNotesArray = [...tempArr];
                    this.EmptyNotes = false;
                    this.avaiableUser = true;
                    this.showSpinner = false;
                })
                .catch((err) => {
                    this.error = err;
                });
        } else if (this.ShowNotesArray.length > 0 && this.ShowNotesArray[0].userid !== this.currentUser) {
            insertNoteSection({
                accountPlan: this.recordId,
                accountPlanTemp: this.templateids,
                message: msg,
                currentUserdata: this.currentUser
            })
                .then((result) => {
                    if (result) {
                        let uservalue = result[0].pqcrush__User__r.Name;
                        let modifiedDate = new Date(result[0].LastModifiedDate);
                        let options = {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        };
                        let formattedDate = modifiedDate.toLocaleString('en-US', options);
                        let tempArr = [...this.ShowNotesArray];
                        let data = {
                            message: result[0].pqcrush__Rich_Text_Area__c,
                            username: uservalue,
                            notesId: result[0].Id,
                            userid: result[0].pqcrush__User__c,
                            dateValue: formattedDate,
                            classValue: 'tempstoreNotes',
                            over: this.showEdit,
                            out: this.disableEdit
                        };
                        tempArr.splice(0, 0, data);
                        this.ShowNotesArray = [...tempArr];
                    }

                    this.EmptyNotes = false;
                    this.avaiableUser = true;
                    this.showSpinner = false;
                })
                .catch((err) => {
                    this.error = err;
                });
        } else {
            updateNoteSection({ notesId: this.notesId, message: this.fieldValue })
                .then((result) => {
                    let tempJsonArr = [...this.ShowNotesArray];
                    let modifiedDate = new Date(result[0].LastModifiedDate);
                    let options = {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    };
                    let formattedDate = modifiedDate.toLocaleString('en-US', options);
                    tempJsonArr[0].message = msg;
                    tempJsonArr[0].dateValue = formattedDate;
                    this.ShowNotesArray = [...tempJsonArr];
                    this.EmptyNotes = false;
                    this.showSpinner = false;
                })
                .catch((err) => {
                    this.error = err;
                });
        }
        let notes = this.template.querySelector('.notes');
        let cancelbtn = this.template.querySelector('.mybtncancel');
        let richtext = this.template.querySelector('.richText');
        notes.style.display = 'block';
        richtext.style.display = 'none';
        cancelbtn.style.display = 'none';
        let textheight = document.createElement('style');
        textheight.innerText = '.slds-rich-text-editor { height: auto;} ';
        this.template.querySelector('lightning-input-rich-text').appendChild(textheight);
        this.fieldValue = '';
    }
}