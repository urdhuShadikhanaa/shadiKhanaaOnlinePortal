import { LightningElement, api } from 'lwc';
import LABEL_LEADS from '@salesforce/label/c.Leads';
import LABEL_SEARCH_CONTACTS from '@salesforce/label/c.Search_Contacts_Dot';
import LABEL_SEARCH_LEADS from '@salesforce/label/c.Search_Leads_Dot';
import LABEL_SEARCH_USERS from '@salesforce/label/c.Search_Users_Dot';
import LABEL_TOGGLE_SEARCH_MODE_CONTACTS from '@salesforce/label/c.Contact_Plural';
import LABEL_TOGGLE_SEARCH_MODE_USERS from '@salesforce/label/c.User_Plural';
import LABEL_SEARCH_ALL from '@salesforce/label/c.Search_All';
import LABEL_SEARCH_WITHIN_ACCOUNT from '@salesforce/label/c.Search_Within_This_Account';

// Tab Visibility
import getTabVisibility from '@salesforce/apex/RelationshipMapSettingsController.getTabVisibility';
import { generateUUID2 } from 'c/utils';

export default class RecordLookup extends LightningElement {
    _excludeContactIds = [];

    _excludeUserIds = [];

    _excludeLeadIds = [];

    _showLeadsTab = false;

    _showUsersTab = false;

    _timeOut = null;

    _searchTerm = '';

    _initialSearched = false;

    @api accountId;

    isSearchingWithinAccount = true;

    searchValue = 'account';

    searchModeValue = 'contact';

    _mapId;

    labels = {
        searchContacts: LABEL_SEARCH_CONTACTS,
        searchLeads: LABEL_SEARCH_LEADS,
        searchUsers: LABEL_SEARCH_USERS
    };

    @api
    get mapId() {
        return this._mapId;
    }

    set mapId(value) {
        this._mapId = value;
        getTabVisibility({ recordId: value }).then((result) => {
            this._showLeadsTab = result.lead;
            this._showUsersTab = result.user;
        });
    }

    async connectedCallback() {
        await getTabVisibility({ recordId: this._mapId }).then((result) => {
            this._showLeadsTab = result.lead;
            this._showUsersTab = result.user;
        });
    }

    @api
    get excludeContactIds() {
        return this._excludeContactIds;
    }

    set excludeContactIds(data) {
        this._excludeContactIds = data;
        this.doSearch(this._searchTerm, true);
    }

    @api
    get excludeUserIds() {
        return this._excludeUserIds;
    }

    set excludeUserIds(data) {
        this._excludeUserIds = data;
        this.doSearch(this._searchTerm, true);
    }

    @api
    get excludeLeadIds() {
        return this._excludeLeadIds;
    }

    set excludeLeadIds(data) {
        this._excludeLeadIds = data;
        this.doSearch(this._searchTerm, true);
    }

    get searchScopeExposed() {
        return this.accountId !== null && this.accountId !== '' && this.searchModeValue === 'contact';
    }

    set searchScopeExposed(value) {
        this._searchScopeExposed = value;
    }

    get searchInputWatermark() {
        if (this.searchModeValue === 'contact') {
            return this.labels.searchContacts;
        }
        if (this.searchModeValue === 'user') {
            return this.labels.searchUsers;
        }
        if (this.searchModeValue === 'lead') {
            return this.labels.searchLeads;
        }

        return '';
    }

    get searchModeOptions() {
        let options = [{ label: LABEL_TOGGLE_SEARCH_MODE_CONTACTS, value: 'contact' }];

        if (this._showUsersTab) {
            options.push({ label: LABEL_TOGGLE_SEARCH_MODE_USERS, value: 'user' });
        }
        if (this._showLeadsTab) {
            options.push({ label: LABEL_LEADS, value: 'lead' });
        }

        return options;
    }

    get searchOptions() {
        return [
            { label: LABEL_SEARCH_ALL, value: 'all' },
            { label: LABEL_SEARCH_WITHIN_ACCOUNT, value: 'account' }
        ];
    }

    handleSearchTermChange(event) {
        var newSearchTerm = event.target.value;

        if (newSearchTerm == null) {
            this.doSearch('', false);

            return;
        }
        newSearchTerm = newSearchTerm.trim().replace(/\*/g).toLowerCase();

        this.doSearch(newSearchTerm, false);
    }

    handleFocus() {
        if (!this._initialSearched) {
            this.doSearch('', true);
            this._initialSearched = true;
        }
    }

    doSearch(searchTerm, forceSearch) {
        if (this._timeOut != null) {
            window.clearTimeout(this._timeOut);
        }

        if (!forceSearch && searchTerm.localeCompare(this._searchTerm) === 0) {
            return;
        }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._timeOut = window.setTimeout(() => {
            const params = {
                searchMode: this.searchModeValue,
                searchTerm: searchTerm
            };

            this._searchTerm = searchTerm;

            switch (this.searchModeValue) {
                case 'user':
                    params.excludeIds = this._excludeUserIds;
                    break;
                case 'contact':
                    params.excludeIds = this._excludeContactIds;
                    break;
                case 'lead':
                    params.excludeIds = this._excludeLeadIds;
                    break;
                default:
                    break;
            }

            params.accountId = this.searchScopeExposed & this.isSearchingWithinAccount ? this.accountId : '';
            params.searchKey = generateUUID2();

            this.fireSearchEvent(params);
        }, 350);
    }

    fireSearchEvent(params) {
        const searchEvent = new CustomEvent('performsearch', {
            detail: params
        });

        this.dispatchEvent(searchEvent);
    }

    handleSearchOptionsClick(event) {
        const selectedOption = event.detail.value;

        this.searchValue = selectedOption;
        this.isSearchingWithinAccount = selectedOption !== 'all';
        this.doSearch(this._searchTerm, true);
    }

    handleChangeSearchMode(event) {
        const selectedOption = event.detail.value;

        this.searchModeValue = selectedOption;

        this.doSearch(this._searchTerm, true);
    }
}