# Urdu Shadikhana — Technical Documentation

Architecture, data model, Apex APIs, LWC structure, integrations, security, and deployment metadata for developers and administrators.

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Experience Cloud Site                         │
│  URL: /urdushadikhanana (new org) or /urdushadikhana (prod)      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  shadikhanaBookingPortal (LWC) — main portal UI           │  │
│  │  shadikhanaLoginNotes (LWC) — login page hints             │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ @AuraEnabled
┌──────────────────────────────▼──────────────────────────────────┐
│  ShadikhanaBookingController (Apex)                              │
│  ├── ShadikhanaBookingPricing (pricing engine)                   │
│  ├── ShadikhanaBookingSmsService (Twilio queueable)                │
│  ├── ShadikhanaBookingNotificationService (notifications)        │
│  └── ShadikhanaBookingPublicAccess (guest sharing helpers)       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  Custom Objects                                                  │
│  Shadikhana_Booking__c | Shadikhana_Settings__c | Portal_Banner__c│
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  Scheduled Jobs                                                  │
│  ShadikhanaCancelledCleanupScheduler → CleanupBatch (monthly)    │
└─────────────────────────────────────────────────────────────────┘
```

### Technology stack

| Layer | Technology |
|-------|------------|
| UI | Lightning Web Components (LWC), SLDS, custom CSS |
| Backend | Apex (API v61.0) |
| Data | Custom objects + Custom Settings (`Shadikhana_Settings__c`) |
| Public site | Experience Cloud (Build Your Own template) |
| SMS | Twilio REST via Named Credential |
| Maps | Google Maps embed (CSP trusted sites) |
| CLI / deploy | Salesforce CLI (`sf`), PowerShell deploy script |

---

## 2. Repository structure

```
OnlineReservation/
├── force-app/main/default/
│   ├── classes/                    # Apex controllers, services, tests, batch
│   ├── lwc/
│   │   ├── shadikhanaBookingPortal/
│   │   └── shadikhanaLoginNotes/
│   ├── objects/
│   │   ├── Shadikhana_Booking__c/
│   │   ├── Shadikhana_Settings__c/
│   │   └── Portal_Banner__c/
│   ├── permissionsets/             # Shadikhana_* only (for deploy)
│   ├── experiences/Urdu_Shadikhana1/   # Production experience bundle
│   ├── networks/, sites/, staticresources/, ...
│   └── settings/ExperienceBundle.settings-meta.xml
├── package/                        # Portable deploy package
├── manifest/urdu-shadi-khanana-full-package.xml
├── scripts/deploy-urdu-shadi-khanana.ps1
└── docs/
```

---

## 3. Data model

### 3.1 Shadikhana_Booking__c

Primary booking record.

| Field API Name | Type | Description |
|----------------|------|-------------|
| `Booking_Date__c` | Date | Start date (required) |
| `End_Date__c` | Date | End date (optional; defaults to start) |
| `Event_Name__c` | Text | Event title |
| `Contact_Name__c` | Text | Requester name |
| `Contact_Phone__c` | Text | Mobile (10 digits) |
| `Contact_Email__c` | Email | Optional email |
| `Notes__c` | Long Text | Additional notes |
| `Event_Details__c` | Long Text | Event description |
| `Start_Time__c` | Text | e.g. `10:00 AM` |
| `End_Time__c` | Text | e.g. `9:00 PM` |
| `Status__c` | Picklist | `Pending`, `Confirmed`, `Cancelled` |
| `Booked_By__c` | Lookup(User) | Who submitted the request |
| `Daily_Rate__c` | Currency | Rate at time of booking |
| `Number_of_Days__c` | Number | Days in range |
| `Estimated_Amount__c` | Currency | Auto-calculated estimate |
| `Final_Amount__c` | Currency | Admin-approved final price |

### 3.2 Shadikhana_Settings__c (Hierarchy Custom Settings)

Org-wide configuration via `getOrgDefaults()`.

| Field | Purpose |
|-------|---------|
| `Default_Daily_Rate__c` | Base daily rate (default ₹8,000) |
| `Admin_Mobile_Number__c` | SMS alert recipient |
| `SMS_Enabled__c` | SMS master switch |
| `Notifications_Enabled__c` | Notification features |
| `Twilio_Account_SID__c` | Twilio SID |
| `Twilio_Auth_Token__c` | Twilio token (protected) |
| `Twilio_From_Number__c` | Sender number |
| `Portal_Admin_Username__c` | Login hint |
| `Portal_Admin_Password__c` | Login hint (display only) |
| `Portal_Login_Notes__c` | Rich login message |
| `Ntfy_*` | Optional ntfy.sh push notification fields |

### 3.3 Portal_Banner__c

| Field | Purpose |
|-------|---------|
| `Title__c`, `Message__c` | Banner content |
| `Is_Active__c` | Show/hide |
| `Banner_Style__c` | Visual style class |
| `Sort_Order__c` | Display order |

---

## 4. Apex components

### 4.1 ShadikhanaBookingController

Central `@AuraEnabled` facade for the LWC.

| Method | Cacheable | Description |
|--------|-----------|-------------|
| `getCurrentUserInfo()` | Yes | User name, guest flag, admin flag, login hints |
| `getBookings(year, month)` | Yes | Calendar month data |
| `getBookedDateStrings(year, month)` | Yes | ISO dates blocked on form |
| `getMyBookings()` | Yes | Current user's bookings |
| `getBookingData()` | Yes | Paginated booking list |
| `getAdminBookings()` | Yes | Admin queue (admin only) |
| `getDailyRate()` | Yes | Current daily rate |
| `calculateBookingPrice(...)` | Yes | Price estimate wrapper |
| `isDateRangeAvailable(start, end)` | No | Pre-submit availability check |
| `createBooking(...)` | No | Creates Pending booking + SMS |
| `updateBookingStatus(id, status)` | No | Confirm/Cancel (admin) |
| `updateBookingPrice(id, amount)` | No | Set final amount (admin) |
| `getPortalSettings()` / `savePortalSettings(...)` | Mixed | SMS/settings CRUD |
| `getPortalFooterInfo()` | Yes | Contact phone/email |
| `getActiveBanners()` / `getAdminBanners()` | Yes | Banner lists |
| `saveBanner(...)` / `deleteBanner(id)` | No | Banner CRUD |
| `getMonthlyAdminReport(...)` | Yes | Monthly report |
| `getAdminBookingReport(start, end)` | Yes | Custom range report |

**Security:** Admin methods call `assertSystemAdministrator()` (checks `UserInfo.getProfileId()` against System Administrator profile or custom admin logic).

**Calendar blocking logic:** Overlap queries exclude `Cancelled` status for availability; confirmed-only blocking for public calendar display; form calendar also blocks Pending.

### 4.2 ShadikhanaBookingPricing

- Default rate: `8000` or `Shadikhana_Settings__c.Default_Daily_Rate__c`
- Multi-day: `dailyRate × dayCount`
- Same-day timed events: hourly occupancy → day charge multiplier
- Validates end time after start time on same day

### 4.3 ShadikhanaBookingSmsService

- Queueable jobs with `Database.AllowsCallouts`
- Uses Named Credential `Twilio_SMS`
- `notifyAdminNewBooking` — on create
- `notifyRequesterBookingConfirmed` — on confirm

### 4.4 ShadikhanaCancelledBookingCleanupBatch

- Deletes cancelled bookings in previous calendar month
- Scheduled by `ShadikhanaCancelledCleanupScheduler` — cron `0 0 0 5 * ?`

### 4.5 Test classes

| Class | Covers |
|-------|--------|
| `ShadikhanaBookingControllerTest` | Controller, status transitions, overlap rules |
| `ShadikhanaBookingPricingTest` | Pricing calculations |
| `ShadikhanaBookingSmsServiceTest` | SMS service (mock callouts) |
| `ShadikhanaBookingNotificationServiceTest` | Notifications |
| `ShadikhanaBookingPublicAccessTest` | Guest access |
| `ShadikhanaCancelledBookingCleanupTest` | Batch delete logic |

---

## 5. LWC — shadikhanaBookingPortal

**File:** `force-app/main/default/lwc/shadikhanaBookingPortal/`

| File | Role |
|------|------|
| `shadikhanaBookingPortal.js` | State, Apex calls, calendar logic, admin UI (~2,400 lines) |
| `shadikhanaBookingPortal.html` | Template: sidebar, home, booking form, admin sections, footer |
| `shadikhanaBookingPortal.css` | Portal theme, glass panels, calendar, footer, responsive layout |
| `shadikhanaBookingPortal.js-meta.xml` | Exposed to Experience Cloud + App pages |

### Key JS state

- `activeTab` — `home` | `bookingData` | `admin`
- `activeAdminSection` — bookings | reports | sms | banners | portalLogin
- `isGuestUser`, `isSystemAdmin` — from `getCurrentUserInfo`
- `calendarDays` — computed month grid with availability CSS classes
- `isSubmitDisabled` / `isBookingFormReady` — mandatory field validation

### Static resources

- `ShadikhanaHallExterior`, `ShadikhanaHallInterior`, `ShadikhanaDiningArea` (PNG)

### Experience Cloud targets

```xml
<target>lightningCommunity__Page</target>
<target>lightningCommunity__Default</target>
<target>lightning__AppPage</target>
```

---

## 6. LWC — shadikhanaLoginNotes

Small component placed on Experience Cloud **Login** page. Reads `getPortalLoginNotes()` and displays admin-configured login hints.

---

## 7. Permission sets

| Permission Set | Assigned to | Purpose |
|----------------|-------------|---------|
| `Shadikhana_Booking_User` | Internal admin users | Apex class, object CRUD, app tab |
| `Shadikhana_Community_Booking` | Community users | Portal booking access |
| `Shadikhana_Guest_Portal` | Site Guest User | Public home + create booking |
| `Shadikhana_Twilio_Callout` | Integration user / admin | Named credential callouts |

---

## 8. Experience Cloud metadata

### Production org bundle

- **Network:** `Urdu Shadikhana`
- **Site:** `Urdu_Shadikhana`
- **ExperienceBundle:** `Urdu_Shadikhana1`
- **URL path:** `/urdushadikhana`

### New org deploy bundle

- **Network / site name:** `Urdu Shadi Khanana` (created via CLI)
- **ExperienceBundle folder:** `package/experience/Urdu_Shadi_Khanana1/`
- **URL path:** `/urdushadikhanana`
- **Home view:** `c:shadikhanaBookingPortal`
- **Guest access:** `isAvailableToGuests: true` in site config

---

## 9. Integrations

### Twilio SMS

| Metadata | Name |
|----------|------|
| Named Credential | `Twilio_SMS` |
| External Credential | `Twilio_SMS` |
| Remote Site | Twilio API (via named credential) |

Credentials stored in org; metadata deploys structure — **update secrets in target org**.

### Google Maps

| CSP Trusted Site | Domain |
|------------------|--------|
| `Google_Maps_Embed` | maps.google.com embed |
| `Google_Maps_WWW` | www.google.com |

---

## 10. Security model

| Concern | Implementation |
|---------|----------------|
| Guest booking | `Shadikhana_Guest_Portal` + guest user assignment script |
| Admin actions | `assertSystemAdministrator()` in Apex |
| FLS / sharing | Permission sets grant field and object access |
| SMS secrets | Custom setting fields + Named Credential (not in LWC) |
| Cancelled price | Server-side zeroing; UI hides edit for cancelled |

---

## 11. Deployment metadata manifest

**File:** `package/urdu-shadi-khanana-full-package.xml`

Lists 90+ metadata components across types: ApexClass, CustomObject, CustomApplication, CustomTab, CspTrustedSite, ExternalCredential, ExperienceBundle, FlexiPage, LightningComponentBundle, NamedCredential, Network, PermissionSet, Settings, SiteDotCom, CustomSite, StaticResource.

**API version:** 61.0

---

## 12. Deploy script flow

**File:** `scripts/deploy-urdu-shadi-khanana.ps1`

```
CreateScratchOrg? → Enable Communities → Enable ExperienceBundle metadata
                 → sf community create
                 → Deploy objects
                 → Deploy Apex/LWC/app/permsets/resources
                 → Deploy package/experience/Urdu_Shadi_Khanana1
                 → Assign permsets
                 → Run seed + guest + scheduler scripts
                 → sf community publish
```

---

## 13. API dependency map (LWC → Apex)

```
shadikhanaBookingPortal
  ├── getCurrentUserInfo
  ├── getBookings / getBookedDateStrings
  ├── getMyBookings / getBookingData
  ├── getAdminBookings / getAdminBookingReport
  ├── getActiveBanners / getAdminBanners / saveBanner / deleteBanner
  ├── createBooking / isDateRangeAvailable
  ├── calculateBookingPrice / getDailyRate
  ├── updateBookingStatus / updateBookingPrice
  ├── getPortalSettings / savePortalSettings
  └── getPortalFooterInfo

shadikhanaLoginNotes
  └── getPortalLoginNotes
```

---

## 14. Extension points

| Change | Where to modify |
|--------|-----------------|
| Daily rate default | `ShadikhanaBookingPricing.DEFAULT_DAILY_RATE` or org settings |
| Footer inclusions | `perDayInclusions` array in LWC JS + footer HTML |
| Contact details | `Shadikhana_Settings__c` or `getPortalFooterInfo` defaults |
| New admin section | `ADMIN_SECTION_NAV` + HTML template + controller methods |
| SMS templates | `ShadikhanaBookingSmsService` message strings |
| Cleanup schedule | `ShadikhanaCancelledCleanupScheduler` cron expression |

---

## 15. Related documents

- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [Functionality Guide](FUNCTIONALITY-GUIDE.md)
- [Package README](../package/README.md)
