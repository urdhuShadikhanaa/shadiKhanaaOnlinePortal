# Urdu Shadikhana — Deployment Package

Portable deployment folder for **Urdu Shadikhana / Urdu Shadi Khanana**. Uses Salesforce **Metadata API** (`sf project deploy`) — **not** unlocked/managed package versions.

## Folder structure

```
deploy/urdu-shadikhana/
├── README.md                      ← You are here
├── PROJECT-DETAILS.md             ← Solution overview, components, integrations
├── POST-DEPLOY-CHECKLIST.md       ← Manual steps after deploy
├── manifest/
│   ├── package-full.xml           ← Complete solution (new org)
│   └── package-delta.xml          ← Recent changes only (existing org)
├── scripts/
│   ├── deploy-full.ps1            ← Full deploy to target org
│   ├── deploy-delta.ps1           ← Incremental deploy
│   └── post-deploy.apex           ← Default settings + guest access + scheduler
└── config/
    └── org-settings-template.md   ← Values to configure per org
```

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Salesforce CLI (`sf`) 2.x | `sf --version` |
| Authenticated target org | `sf org login web --alias my-target-org` |
| Experience Cloud license | Required for public booking site |
| Project source | This folder deploys from `force-app/` at project root |

## Quick start — new org (full deploy)

```powershell
cd C:\Users\PSK\Documents\OnlineReservation

# 1. Authenticate
sf org login web --alias my-target-org

# 2. Deploy everything
.\deploy\urdu-shadikhana\scripts\deploy-full.ps1 -TargetOrg my-target-org

# 3. Complete manual steps
#    See POST-DEPLOY-CHECKLIST.md
```

## Quick start — existing org (recent changes only)

Deploys email-on-status-change, dual admin SMS, and portal updates:

```powershell
.\deploy\urdu-shadikhana\scripts\deploy-delta.ps1 -TargetOrg my-target-org -RunTests
```

## Manual manifest deploy (alternative)

```powershell
sf project deploy start `
  --manifest deploy\urdu-shadikhana\manifest\package-full.xml `
  --source-dir force-app `
  --target-org my-target-org `
  --test-level NoTestRun `
  --wait 30
```

## Related project paths

| Path | Purpose |
|------|---------|
| `force-app/main/default/` | Salesforce source metadata |
| `package/` | Experience pages, scratch org def, legacy package copy |
| `manifest/` | Root-level manifests (kept in sync with `deploy/urdu-shadikhana/manifest/`) |
| `scripts/deploy-urdu-shadi-khanana.ps1` | Original automated deploy (scratch org + site creation) |
| `docs/DEPLOYMENT-GUIDE.md` | Extended deployment guide |
| `docs/FUNCTIONALITY-GUIDE.md` | Business / user functionality |
| `docs/TECHNICAL-DOCUMENTATION.md` | Architecture and APIs |

## Default portal URL paths

| Environment | Example URL |
|-------------|-------------|
| New scratch deploy | `https://<domain>.my.site.com/urdushadikhanana` |
| Production (Shabbir Tech) | `https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana` |

## What gets deployed (full manifest)

- **Objects:** `Shadikhana_Booking__c`, `Shadikhana_Settings__c`, `Shadikhana_Daily_Rate__c`, `Portal_Banner__c`
- **Apex:** Controller, pricing, SMS, email, notifications, branding, cleanup batch + tests
- **LWC:** `shadikhanaBookingPortal`, `shadikhanaLoginNotes`
- **Integrations:** Twilio Named Credential, Google Maps CSP sites
- **Access:** 4 permission sets, Lightning app, tabs, flexipage
- **Assets:** Hall static resources, Experience Cloud bundle (when site exists)

## Support scripts (project root)

| Script | Purpose |
|--------|---------|
| `scripts/seed-sms-settings.apex` | SMS / admin mobile defaults |
| `scripts/seed-portal-contact-settings.apex` | Portal URLs and footer contact |
| `scripts/apex/assignGuestPortalAccess.apex` | Guest user permission set |
| `scripts/apex/schedule-cancelled-cleanup.apex` | Monthly cleanup scheduler |
