# Urdu Shadikhana — Deployment Guide

This guide explains how to deploy the **Urdu Shadikhana / Urdu Shadi Khanana** booking portal to a **new Salesforce org**.

---

## 1. Prerequisites

### Software

| Tool | Minimum version | Install |
|------|-----------------|---------|
| Salesforce CLI (`sf`) | 2.x | [Install Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) |
| PowerShell | 5.1+ (Windows) | Built into Windows |
| Git (optional) | Any | For cloning the repository |

Verify CLI:

```powershell
sf --version
```

### Salesforce accounts

| Requirement | Notes |
|-------------|-------|
| **Dev Hub** (for scratch orgs) | A Production or Developer Edition org with Dev Hub enabled |
| **Target org** | Scratch org, Developer Edition, or Sandbox with Experience Cloud licenses |
| **Experience Cloud** | Required for the public booking site |

### Project location

All commands assume the project root:

```
C:\Users\PSK\Documents\OnlineReservation
```

---

## 2. Package files on your local system

### Deployment package folder

```
OnlineReservation/
├── package/
│   ├── README.md
│   ├── urdu-shadi-khanana-full-package.xml    ← Metadata manifest
│   ├── config/
│   │   ├── urdu-shadi-khanana-scratch-def.json
│   │   └── Communities.settings-meta.xml
│   └── experience/
│       └── Urdu_Shadi_Khanana1/               ← Site Home + Login pages
├── force-app/main/default/                    ← Full source metadata
├── manifest/urdu-shadi-khanana-full-package.xml
├── config/
├── scripts/deploy-urdu-shadi-khanana.ps1
└── docs/                                      ← This documentation
```

### What the manifest includes

- **Custom objects:** `Shadikhana_Booking__c`, `Shadikhana_Settings__c`, `Portal_Banner__c`
- **Apex:** Controller, pricing, SMS, notifications, public access, cleanup batch + tests
- **LWC:** `shadikhanaBookingPortal`, `shadikhanaLoginNotes`
- **App:** `Urdu_Shadikhana` Lightning app, tabs, flexipage
- **Permission sets:** Booking User, Community Booking, Guest Portal, Twilio Callout
- **Integrations:** Twilio Named Credential + External Credential
- **Assets:** Hall images (static resources), Google Maps CSP trusted sites
- **Experience Cloud:** Network, site, experience bundle (for orgs that support metadata deploy)

---

## 3. Authenticate Salesforce orgs

### Connect Dev Hub (scratch org creation)

```powershell
sf org login web --alias devhub --set-default-dev-hub
```

### Connect target org (Developer Edition / existing org)

```powershell
sf org login web --alias my-new-org
```

List authenticated orgs:

```powershell
sf org list
```

---

## 4. Deployment options

### Option A — Automated script (recommended)

#### New scratch org (30-day trial org from Dev Hub)

```powershell
cd C:\Users\PSK\Documents\OnlineReservation
.\scripts\deploy-urdu-shadi-khanana.ps1 -CreateScratchOrg -DevHub devhub
```

Optional parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-TargetOrg` | `urdushadikhanana` | CLI alias for the org |
| `-DevHub` | `Learning org` | Dev Hub alias |
| `-CreateScratchOrg` | (switch) | Creates a new scratch org before deploy |

#### Existing org

```powershell
.\scripts\deploy-urdu-shadi-khanana.ps1 -TargetOrg my-new-org
```

The script performs these steps automatically:

1. Enable Communities / Networks (if scratch org)
2. Create Experience Cloud site (`Build Your Own` template, URL `/urdushadikhanana`)
3. Deploy custom objects
4. Deploy Apex, LWC, app, permission sets, static resources, Twilio credentials
5. Deploy Experience Cloud pages with booking portal on Home
6. Assign permission sets to admin
7. Run post-deploy Apex scripts (settings, guest access, cleanup scheduler)
8. Publish the Experience Cloud site

---

### Option B — Manual step-by-step deploy

Use this when the script fails or you need fine-grained control.

#### Step 1 — Enable Digital Experiences

```powershell
sf project deploy start `
  --source-dir package\config\Communities.settings-meta.xml `
  --target-org my-new-org --wait 30

sf project deploy start `
  --source-dir force-app\main\default\settings\ExperienceBundle.settings-meta.xml `
  --target-org my-new-org --wait 30
```

#### Step 2 — Create Experience Cloud site

```powershell
sf community create `
  --name "Urdu Shadi Khanana" `
  --template-name "Build Your Own" `
  --url-path-prefix urdushadikhanana `
  --description "Urdu Shadi Khanana booking portal" `
  --target-org my-new-org
```

Wait ~60 seconds for site creation to finish.

#### Step 3 — Deploy custom objects

```powershell
sf project deploy start `
  --source-dir force-app\main\default\objects\Shadikhana_Booking__c `
  --source-dir force-app\main\default\objects\Shadikhana_Settings__c `
  --source-dir force-app\main\default\objects\Portal_Banner__c `
  --target-org my-new-org --wait 30
```

#### Step 4 — Deploy application code and config

Deploy only Shadikhana permission sets (do **not** deploy the entire `permissionsets` folder — it contains unrelated org permission sets):

```powershell
sf project deploy start `
  --source-dir force-app\main\default\classes `
  --source-dir force-app\main\default\lwc\shadikhanaBookingPortal `
  --source-dir force-app\main\default\lwc\shadikhanaLoginNotes `
  --source-dir force-app\main\default\applications\Urdu_Shadikhana.app-meta.xml `
  --source-dir force-app\main\default\tabs `
  --source-dir force-app\main\default\flexipages\Urdu_Shadikhana_Portal.flexipage-meta.xml `
  --source-dir force-app\main\default\permissionsets\Shadikhana_Booking_User.permissionset-meta.xml `
  --source-dir force-app\main\default\permissionsets\Shadikhana_Community_Booking.permissionset-meta.xml `
  --source-dir force-app\main\default\permissionsets\Shadikhana_Guest_Portal.permissionset-meta.xml `
  --source-dir force-app\main\default\permissionsets\Shadikhana_Twilio_Callout.permissionset-meta.xml `
  --source-dir force-app\main\default\staticresources `
  --source-dir force-app\main\default\cspTrustedSites `
  --source-dir force-app\main\default\namedCredentials `
  --source-dir force-app\main\default\externalCredentials `
  --target-org my-new-org --test-level NoTestRun --wait 30
```

#### Step 5 — Deploy Experience Cloud pages

```powershell
sf project deploy start `
  --source-dir package\experience\Urdu_Shadi_Khanana1 `
  --target-org my-new-org --test-level NoTestRun --wait 30
```

#### Step 6 — Post-deploy setup

```powershell
sf org assign permset --name Shadikhana_Booking_User --target-org my-new-org
sf org assign permset --name Shadikhana_Twilio_Callout --target-org my-new-org

sf apex run --file scripts\seed-sms-settings.apex --target-org my-new-org
sf apex run --file scripts\apex\assignGuestPortalAccess.apex --target-org my-new-org
sf apex run --file scripts\apex\schedule-cancelled-cleanup.apex --target-org my-new-org

sf community publish --name "Urdu Shadi Khanana" --target-org my-new-org
```

#### Step 7 — Verify

```powershell
sf org display --target-org my-new-org
```

Open the portal:

```
https://<domain>.my.site.com/urdushadikhanana
```

---

### Option C — Deploy using manifest only

For orgs that already have Experience Cloud configured:

```powershell
sf project deploy start `
  --manifest package\urdu-shadi-khanana-full-package.xml `
  --target-org my-new-org `
  --test-level NoTestRun --wait 30
```

> **Note:** Experience Cloud metadata deploy requires `enableExperienceBundleMetadata` and an existing compatible site. For brand-new orgs, use Option A or B.

---

## 5. Post-deployment configuration

### Admin user setup

| Task | How |
|------|-----|
| Assign permission sets | `Shadikhana_Booking_User` to admin; `Shadikhana_Community_Booking` to community users |
| System Administrator profile | Required for Administration tab in the portal |
| Open internal app | App Launcher → **Urdu Shadikhana** |

### Guest (public) access

The script `assignGuestPortalAccess.apex` assigns `Shadikhana_Guest_Portal` to the site guest user. Verify under **Setup → Users** (filter User Type = Guest).

### SMS (Twilio) — optional

1. Open **Administration → SMS Notifications** in the portal (or edit `Shadikhana_Settings__c` org defaults)
2. Enter Twilio Account SID, Auth Token, From Number
3. Enable SMS
4. Update Named Credential `Twilio_SMS` in Setup if credentials differ from deployed metadata

### Portal login notes — optional

Configure **Portal Login Notes** in Administration to show username/password hints on the Experience Cloud login page.

### Site admin user (manual deploy only)

If deploying `Urdu_Shadikhana.site-meta.xml` manually, set `<siteAdmin>` and `<siteGuestRecordDefaultOwner>` to the target org admin username before deploy.

---

## 6. Run Apex tests (production deploys)

For production or CI/CD pipelines with test enforcement:

```powershell
sf project deploy start `
  --source-dir force-app\main\default\classes `
  --target-org my-new-org `
  --test-level RunSpecifiedTests `
  --tests ShadikhanaBookingControllerTest `
  --tests ShadikhanaBookingPricingTest `
  --tests ShadikhanaBookingSmsServiceTest `
  --tests ShadikhanaBookingNotificationServiceTest `
  --tests ShadikhanaBookingPublicAccessTest `
  --tests ShadikhanaCancelledBookingCleanupTest `
  --wait 30
```

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| `Communities must be enabled` | Deploy `package/config/Communities.settings-meta.xml` first |
| `enableExperienceBundleMetadata` fails on scratch org | Deploy Communities settings first, then ExperienceBundle settings |
| `Not available for deploy for this organization` (ExperienceBundle) | Create site with `sf community create`, then deploy `package/experience/` |
| Permission set deploy fails on unrelated objects | Deploy only the four `Shadikhana_*` permission set files |
| Guest cannot submit booking | Re-run `assignGuestPortalAccess.apex` |
| Portal shows default “Let's get started” page | Redeploy `package/experience/Urdu_Shadi_Khanana1/views/home.json` and publish site |
| SMS not sending | Check Twilio credentials, `SMS_Enabled__c`, and `Shadikhana_Twilio_Callout` permission set |

---

## 8. Environment reference

| Environment | Org alias | Portal URL |
|-------------|-----------|------------|
| Production (existing) | `onlinereservation` | https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana |
| Scratch (example) | `urdushadikhanana` | https://dream-power-6497-dev-ed.scratch.my.site.com/urdushadikhanana |

Update this table when you deploy to additional orgs.
