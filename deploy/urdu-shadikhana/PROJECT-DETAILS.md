# Urdu Shadikhana — Project Details

## Solution name

| Name | Usage |
|------|-------|
| **Urdu Shadikhana** | Primary branding |
| **Urdu Shadi Khanana** | Alternate / scratch org naming |
| **Online Reservation** | Local project folder name |

## Purpose

Salesforce Experience Cloud booking portal for a community hall / event venue. Guests submit booking requests online; administrators confirm, cancel, and manage pricing. Notifications via **email** and **SMS (Twilio)**.

## Architecture

```
Experience Cloud Site (Urdu Shadikhana)
    └── LWC: shadikhanaBookingPortal (Home tab)
            ├── Apex: ShadikhanaBookingController
            ├── Pricing: ShadikhanaBookingPricing
            ├── Email: ShadikhanaBookingEmailService
            ├── SMS: ShadikhanaBookingSmsService
            ├── Push: ShadikhanaBookingNotificationService (ntfy.sh)
            └── Data: Shadikhana_Booking__c, Shadikhana_Settings__c
```

## Custom objects

| API Name | Purpose |
|----------|---------|
| `Shadikhana_Booking__c` | Booking requests (Pending / Confirmed / Cancelled) |
| `Shadikhana_Settings__c` | Org-wide portal settings (SMS, email, rates, hall config) |
| `Shadikhana_Daily_Rate__c` | Per-date rate overrides for admin pricing |
| `Portal_Banner__c` | Portal announcement banners |

## Apex classes (17)

| Class | Role |
|-------|------|
| `ShadikhanaBookingController` | Main portal API (bookings, admin, settings, banners) |
| `ShadikhanaBookingPricing` | Price calculation, daily rates, hall config |
| `ShadikhanaBookingEmailService` | Booking + status-change emails |
| `ShadikhanaBookingSmsService` | Admin alert SMS, requester confirmation SMS |
| `ShadikhanaBookingNotificationService` | ntfy.sh push notifications |
| `ShadikhanaBookingPublicAccess` | Guest-safe SOQL queries |
| `ShadikhanaPortalBrandingService` | Gallery / branding uploads |
| `ShadikhanaCancelledBookingCleanupBatch` | Removes old cancelled bookings |
| `ShadikhanaCancelledCleanupScheduler` | Schedules monthly cleanup |
| `*Test` classes | Unit tests for each service |

## Lightning Web Components

| Component | Usage |
|-----------|-------|
| `shadikhanaBookingPortal` | Main portal (booking wizard, calendar, admin) |
| `shadikhanaLoginNotes` | Login page notes on Experience Cloud |

## Permission sets

| Permission Set | Assigned to |
|----------------|-------------|
| `Shadikhana_Guest_Portal` | Experience Cloud guest user |
| `Shadikhana_Booking_User` | Internal admin users |
| `Shadikhana_Community_Booking` | Community logged-in users |
| `Shadikhana_Twilio_Callout` | Users/system making Twilio callouts |

## Integrations

| Integration | Settings fields | Notes |
|-------------|-----------------|-------|
| **Twilio SMS** | `Twilio_Account_SID__c`, `Twilio_Auth_Token__c`, `Twilio_From_Number__c` | Trial accounts require verified destination numbers |
| **Email** | `Email_Enabled__c`, `Admin_Email__c` | Uses org-wide email address when configured |
| **ntfy.sh** | `Ntfy_Topic__c`, `Ntfy_Server_URL__c`, `Ntfy_Access_Token__c` | Optional push notifications |

## Notification flows

| Event | Email | SMS |
|-------|-------|-----|
| New booking request | Requester + Admin | Admin (comma-separated mobiles) |
| Admin confirms booking | Requester (if email exists) | Requester |
| Admin cancels booking | Requester (if email exists) | — |

### Admin SMS numbers

Store in `Admin_Mobile_Number__c` as comma-separated values:

```
6364054881, 9849939703
```

Each number receives a **separate Twilio callout**.

### Requester email resolution

1. `Contact_Email__c` on booking
2. Else logged-in user email from `Booked_By__c`
3. Skip if neither exists

## API version

- Project `sfdx-project.json`: **61.0**
- Deploy manifests: **61.0**

## Source API layout

```
force-app/main/default/
├── applications/
├── classes/
├── cspTrustedSites/
├── experiences/
├── externalCredentials/
├── flexipages/
├── lwc/
├── namedCredentials/
├── networks/
├── objects/
├── permissionsets/
├── settings/
├── sites/
├── staticresources/
└── tabs/
```

## Production reference org

| Item | Value |
|------|-------|
| Org username | `onlinereservations@shabbirtech.com` |
| CLI alias | `online reservation` |
| Portal URL | `https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana` |
| Admin email | `urdhushadikhanaa@gmail.com` |
| Admin SMS | `6364054881, 9849939703` |

## Delta package contents (recent enhancements)

`manifest/package-delta.xml` includes:

- Requester email on Confirm / Cancel (`ShadikhanaBookingEmailService`)
- Dual admin SMS comma-separated support
- Updated portal SMS help text and admin mobile placeholder
- Controller tests for status-change email behavior
