import { LightningElement, api } from 'lwc';
import svgAddContact from './svgAddContact.html';
import svgAvatar from './svgAvatar.html';
import svgContactCard from './svgContactCardIcon.html';
import svgDrawIcon from './svgDrawRelIcon.html';
import svgEditIcon from './svgEditIcon.html';
import svgGeneric from './svgGeneric.html';
import svgGroupIcon from './svgGroupIcon.html';
import svgInfluenceIcon from './svgInfluenceIcon.html';
import svgLeadIcon from './svgLeadIcon.html';
import svgNewTask from './svgNewTask.html';
import svgOmni from './svgOmni.html';
import svgPlaceholder from './svgPlaceholder.html';
import svgRemoveIcon from './svgRemoveIcon.html';
import svgRelationshipMapCloud from './svgRelationshipMapCloud.html';
import svgReplace from './svgReplaceIcon.html';
import svgReportsTo from './svgReportsToIcon.html';
import svgSetTargetAnchor from './svgSetTargetAnchor.html';
import svgShowEmpty from './svgShowEmpty.html';
import svgUngroup from './svgUngroup.html';
import svgUser from './svgUser.html';

export default class SvgProvider extends LightningElement {
    @api svgName;

    @api width;

    @api height;

    @api styles;

    @api svgData;

    svgDataPaths = [];

    renderHtml = {
        contacttomember: svgAddContact,
        contact: svgContactCard,
        draw: svgDrawIcon,
        editlabel: svgEditIcon,
        generic: svgGeneric,
        group: svgGroupIcon,
        lead: svgLeadIcon,
        member: svgInfluenceIcon,
        newcontact: svgAddContact,
        newtask: svgNewTask,
        omni: svgOmni,
        placeholder: svgPlaceholder,
        relationshipMapCloud: svgRelationshipMapCloud,
        remove: svgRemoveIcon,
        replace: svgReplace,
        reportsto: svgReportsTo,
        ungroup: svgUngroup,
        settargetanchor: svgSetTargetAnchor,
        showempty: svgShowEmpty,
        updateprofileimage: svgAvatar,
        userprofile: svgUser
    };

    connectedCallback() {
        this.processDataString();
    }

    render() {
        if (this.renderHtml[this.svgName]) {
            return this.renderHtml[this.svgName];
        }

        return svgShowEmpty;
    }

    processDataString() {
        if (!this.svgData || !this.svgData.geometryString) {
            this.svgDataPaths = [{ key: 1, path: '' }];

            return;
        }
        const arr = this.svgData.geometryString.split(' x ');
        let key = 0;

        arr.forEach((item) => {
            this.svgDataPaths.push({ key: key++, path: item });
        });
    }
}