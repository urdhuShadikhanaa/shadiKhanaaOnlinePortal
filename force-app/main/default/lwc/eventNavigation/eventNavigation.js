import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

export default class CreateEventNavigation extends NavigationMixin(LightningElement) {
    @api invokeNewRecordEvent(objectApiName, values = {}, navigationLocation, actionName, recordId) {
        const defaultValues = encodeDefaultFieldValues(values);

        let attr = {
            objectApiName: objectApiName,
            actionName: actionName
        };

        if (recordId) {
            attr.recordId = recordId;
        }

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: attr,
            state: {
                count: '1',
                nooverride: '1',
                useRecordTypeCheck: '1',
                defaultFieldValues: defaultValues,
                navigationLocation: navigationLocation
            }
        });
    }
}