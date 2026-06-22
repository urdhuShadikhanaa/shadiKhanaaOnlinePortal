import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import { reduceErrors } from 'c/ldsUtils';

import getInfSuppCount from '@salesforce/apex/DataCleanupController.getCountOfMembersNeedingInfluenceSupportCleanup';
import doInfSuppCleanup from '@salesforce/apex/DataCleanupController.cleanupMembersNeedingInfluenceSupport';

import getRecordCountForKSMapConversion from '@salesforce/apex/DataCleanupController.getRecordCountForKSMapConversion';
import startKSMapConversionBatch from '@salesforce/apex/DataCleanupController.startKSMapConversionBatch';
import isKSMapConversionRunning from '@salesforce/apex/DataCleanupController.isKSMapConversionRunning';

import getFieldsForKSMigration from '@salesforce/apex/DataCleanupController.getFieldsForKSMigration';
import getRecordCountForKSMigration from '@salesforce/apex/DataCleanupController.getRecordCountForKSMigration';
import doKSMigrationCleanup from '@salesforce/apex/DataCleanupController.startKSMigrationCleanupBatch';
import isKSMigrationRunning from '@salesforce/apex/DataCleanupController.isKSMigrationRunning';
import startRelationshipCountBatch from '@salesforce/apex/DataCleanupController.startRelationshipMemberUpdateCountBatch';



export default class SettingsDataCleanup extends LightningElement {
    errorMessage = null;
    loading = false;
    loadingInfSuppCount = false;
    influenceSupportCount = 0;
    migratedInfSuppData = false;
    infSuppCountLabel = 'Migrate Influence & Support (0 records)';

    loadingKsMapConversionCount = false;
    ksMapConversionCount = 0;
    ksMapConversionRunning = true;
    ksMapConversionCountTimer = null;
    ksMapConversionRunningTimer = null;

    loadingKSMigrationCount = false;
    ksMigrationCount = 0;
    KSMigrationRunning = true;
    ksFieldsAvailableToMigrate = [];
    ksMigrationCountTimer = null;
    KSMigrationRunningTimer = null;

    get ksMapConversionCountLabel() {
        if (this.ksMapConversionCount === 0) {
            return 'There are no Account Plans that need Relationship Maps';
        }
        if (this.ksMapConversionRunning) {
            return `Running batch to add Relationship Maps to Account Plans: ${this.ksMapConversionCount} plans still being updated`;
        }
        return `Create Relationship Maps for Account Plans: ${this.ksMapConversionCount} plans to update`;
    }

    get ksMigrationCountLabel() {
        if (this.ksFieldsAvailableToMigrate.length === 0) {
            return 'There are no Map Member fields matching Key Stakeholder fields for data migration';
        }
        if (this.ksMigrationCount === 0) {
            return 'There are no records that need to be updated';
        }
        if (this.KSMigrationRunning) {
            return `Running batch to update Map Member fields: ${this.ksFieldsAvailableToMigrate} (${this.ksMigrationCount} records still being updated)`;
        }
        return `Update Map Member fields: ${this.ksFieldsAvailableToMigrate} (${this.ksMigrationCount} records to update)`;
    }

    get disableConvertKSMap() {
        return this.ksMapConversionRunning || this.ksMapConversionCount === 0;
    }

    get disableMigrateKSFields() {
        return (
            this.migratingKSMigrationData ||
            this.ksFieldsAvailableToMigrate.length === 0 ||
            this.ksMigrationCount === 0 ||
            this.KSMigrationRunning
        );
    }

    labels = {
        migrate: 'Migrate',
        migrateCustomFields: 'Copy custom field values from Key_Stakeholder__c to Relationship_Map_Member__c',
        header: 'Data Migration & Cleanup',
        subheader: 'Note - These operations are batched and may not happen instantaneously',
        error: 'Error',
        errorInflSuppCount: 'Error in getting Influence & Support count',
        errorMigratingInflSuppData: 'Error while starting migration of Influence & Support data',
        ksMapConversionTitle:
            'This will add Relationship Maps to any Account Plans that were missed during an upgrade from a version of CRUSH prior to 14.0. If this finishes with unconverted plans, check your apex jobs for errors.',
        errorKsMapConversionCount: 'Error in getting count of plans to update',
        errorCheckingKsMapConversionRunning: 'Error while checking if the batch conversion is already running',
        errorMigratingKsMapConversionData: 'Error while creating Relationship Maps for Account Plans',
        startConversion: 'Start Conversion',
        errorKSMigrationFields: 'Error in getting valid fields to copy',
        errorKSMigrationCount: 'Error in getting count of records to update',
        errorCheckingKSMigrationRunning: 'Error while checking if the batch copy is already running',
        errorMigratingKSMigrationData: 'Error while copying Key Stakeholder fields to Map Members',
        startCopy: 'Start Copy',
        relationshipCountBatch: 'Relationship Count Batch'
    };

    get migratingInfSuppData() {
        return this.migratedInfSuppData && this.influenceSupportCount > 0;
    }

    get convertingKSMapData() {
        return this.ksMapConversionRunning && this.ksMapConversionCount > 0;
    }

    get migratingKSMigrationData() {
        return this.KSMigrationRunning && this.ksMigrationCount > 0;
    }

    connectedCallback() {
        this.updateInfSuppCount();
        this.checkMapConversionRunning();
        this.updateKSMapConversionCount();
        this.checkMigrationRunning();
        this.fetchKSMigrationFields();
        this.updateKSMigrationCount();
    }

    /**********************************
     * INFLUENCE & SUPPORT CONVERSION *
     **********************************/

    updateInfSuppCount() {
        getInfSuppCount()
            .then((result) => {
                this.influenceSupportCount = result;
                this.infSuppCountLabel = `Migrate Influence & Support (${result} records)`;
                this.loadingInfSuppCount = false;
                if (this.migratedInfSuppData && this.influenceSupportCount > 0) {
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    window.setTimeout(() => {
                        this.updateInfSuppCount();
                    }, 500);
                }
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorInflSuppCount);
            });
    }

    doInfluenceSupportMigration() {
        this.errorMessage = null;
        this.loading = true;
        doInfSuppCleanup()
            .then(() => {
                this.migratedInfSuppData = true;
                this.loading = false;
                this.updateInfSuppCount();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorMigratingInflSuppData);
            });
    }

    /**********************************
     * KEY STAKEHOLDER MAP CONVERSION *
     **********************************/

    checkMapConversionRunning() {
        isKSMapConversionRunning()
            .then((result) => {
                this.ksMapConversionRunning = result;
                this.restartKSMapConversionRunningTimer();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorCheckingKsMapConversionRunning);
            });
    }

    updateKSMapConversionCount() {
        getRecordCountForKSMapConversion()
            .then((result) => {
                this.ksMapConversionCount = result;
                this.loadingKsMapConversionCount = false;
                this.restartKSMapConversionCountTimer();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorKsMapConversionCount);
            });
    }

    doKSMapConversion() {
        this.errorMessage = null;
        this.loading = true;
        startKSMapConversionBatch()
            .then(() => {
                this.ksMapConversionRunning = true;
                this.loading = false;
                this.restartKSMapConversionRunningTimer();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorMigratingKsMapConversionData);
            });
    }

    restartKSMapConversionRunningTimer() {
        if (this.ksMapConversionRunningTimer) {
            window.clearTimeout(this.ksMapConversionRunningTimer);
            this.ksMapConversionRunningTimer = null;
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.ksMapConversionRunningTimer = window.setTimeout(() => {
            this.checkMapConversionRunning();
        }, 2000);
    }

    restartKSMapConversionCountTimer() {
        if (this.ksMapConversionCountTimer) {
            window.clearTimeout(this.ksMapConversionCountTimer);
            this.ksMapConversionCountTimer = null;
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.ksMapConversionCountTimer = window.setTimeout(() => {
            this.updateKSMapConversionCount();
        }, 500);
    }

    /***********************************
     * KEY STAKEHOLDER FIELD MIGRATION *
     ***********************************/

    checkMigrationRunning() {
        isKSMigrationRunning()
            .then((result) => {
                this.KSMigrationRunning = result;
                this.restartKSMigrationRunningTimer();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorCheckingKSMigrationRunning);
            });
    }

    updateKSMigrationCount() {
        getRecordCountForKSMigration()
            .then((result) => {
                this.ksMigrationCount = result;
                this.loadingKSMigrationCount = false;
                this.restartKSMigrationCountTimer();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorKSMigrationCount);
            });
    }

    doKStoRMMigration() {
        this.errorMessage = null;
        this.loading = true;
        doKSMigrationCleanup()
            .then(() => {
                this.KSMigrationRunning = true;
                this.loading = false;
                this.restartKSMigrationRunningTimer();
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorMigratingKSMigrationData);
            });
    }

    handleRelationshipCountBatch() {
        this.errorMessage = null;
        this.loading = true;
        startRelationshipCountBatch().then(result => {
					this.errorMessage = result;
					this.loading = false;
				})
				.catch(error => {
					this.error = error;
				});
        this.showSuccessToast();
    }

    fetchKSMigrationFields() {
        this.errorMessage = null;
        this.loading = true;
        getFieldsForKSMigration()
            .then((result) => {
                this.ksFieldsAvailableToMigrate = result;
                this.loading = false;
            })
            .catch((error) => {
                this.notifyError(error, this.labels.errorKSMigrationFields);
            });
    }

    restartKSMigrationRunningTimer() {
        if (this.KSMigrationRunningTimer) {
            window.clearTimeout(this.KSMigrationRunningTimer);
            this.KSMigrationRunningTimer = null;
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.KSMigrationRunningTimer = window.setTimeout(() => {
            this.checkMigrationRunning();
        }, 2000);
    }

    restartKSMigrationCountTimer() {
        if (this.ksMigrationCountTimer) {
            window.clearTimeout(this.ksMigrationCountTimer);
            this.ksMigrationCountTimer = null;
        }
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.ksMigrationCountTimer = window.setTimeout(() => {
            this.updateKSMigrationCount();
        }, 500);
    }

    notifyError(error, title = this.labels.error) {
        const erromsg = reduceErrors(error).join(', ');
        this.errorMessage = erromsg;
        const evt = new ShowToastEvent({
            title: title,
            message: erromsg,
            variant: 'error',
            mode: 'pester'
        });
        this.dispatchEvent(evt);
        this.loading = false;
    }
		showSuccessToast() {
    const event = new ShowToastEvent({
        title: 'Success',
        message: 'Relationship map member count batch job has been submitted successfully!',
        variant: 'success',
        mode: 'dismissable'
    });
    this.dispatchEvent(event);
}
}