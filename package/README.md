# Urdu Shadi Khanana — Local Deployment Package

Portable deployment package for **Urdu Shadikhana**. For full deploy instructions to another org (metadata API, no package version), see:

**[`deploy/urdu-shadikhana/`](../deploy/urdu-shadikhana/README.md)**

## Package contents

| Path | Purpose |
|------|---------|
| `urdu-shadi-khanana-full-package.xml` | Salesforce manifest listing all Shadikhana metadata types |
| `config/urdu-shadi-khanana-scratch-def.json` | Scratch org definition (Experience Cloud enabled) |
| `config/Communities.settings-meta.xml` | Enables Digital Experiences / Networks in a new org |
| `experience/Urdu_Shadi_Khanana1/` | Experience Cloud site pages (Home + Login with portal LWC) |

## Related project paths

| Path | Purpose |
|------|---------|
| `force-app/main/default/` | Full Salesforce source (Apex, LWC, objects, permissions, etc.) |
| `manifest/urdu-shadi-khanana-full-package.xml` | Master copy of the manifest (kept in sync with this folder) |
| `scripts/deploy-urdu-shadi-khanana.ps1` | Automated deploy script for Windows PowerShell |
| `scripts/seed-sms-settings.apex` | Seeds default SMS / notification settings |
| `scripts/apex/assignGuestPortalAccess.apex` | Assigns guest permission set to site guest user |
| `scripts/apex/schedule-cancelled-cleanup.apex` | Schedules monthly cancelled-booking cleanup batch |
| `docs/DEPLOYMENT-GUIDE.md` | Step-by-step deployment instructions |
| `docs/FUNCTIONALITY-GUIDE.md` | End-to-end business / user functionality |
| `docs/TECHNICAL-DOCUMENTATION.md` | Architecture, data model, APIs, integrations |

## Quick deploy

From the project root (`OnlineReservation`):

```powershell
.\scripts\deploy-urdu-shadi-khanana.ps1 -CreateScratchOrg
```

Or deploy to an existing authenticated org:

```powershell
sf org login web --alias my-new-org
.\scripts\deploy-urdu-shadi-khanana.ps1 -TargetOrg my-new-org
```

## Default portal URL path

New org deployments use Experience Cloud URL path:

```
https://<your-domain>.my.site.com/urdushadikhanana
```

The existing production org (`onlinereservation`) uses `/urdushadikhana`.
