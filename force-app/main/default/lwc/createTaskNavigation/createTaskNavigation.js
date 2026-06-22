import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

export default class CreateTaskNavigation extends NavigationMixin(LightningElement) {
    @api handleCreateTask(values = {}) {
        const defaultValues = encodeDefaultFieldValues(values);

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Task',
                actionName: 'new'
            },
            state: {
                count: '1',
                nooverride: '1',
                useRecordTypeCheck: '1',
                defaultFieldValues: defaultValues,
                navigationLocation: 'RELATED_LIST'
            }
        });
    }
}