# Urdu Shadikhana — Documentation Index

Project documentation for the Salesforce booking portal.

## Package (local)

| Location | Description |
|----------|-------------|
| [`deploy/urdu-shadikhana/`](../deploy/urdu-shadikhana/) | **Primary deploy folder** — manifests, scripts, checklist (no package version) |
| [`package/`](../package/) | Experience pages, scratch org def, legacy manifest copy |
| [`manifest/urdu-shadi-khanana-full-package.xml`](../manifest/urdu-shadi-khanana-full-package.xml) | Full metadata manifest (synced with deploy folder) |
| [`scripts/deploy-urdu-shadi-khanana.ps1`](../scripts/deploy-urdu-shadi-khanana.ps1) | Automated deploy with scratch org + site creation |

## Guides

| Document | Audience | Contents |
|----------|----------|----------|
| [Deployment Guide](DEPLOYMENT-GUIDE.md) | Admins, DevOps | Prerequisites, deploy to new orgs, troubleshooting |
| [Functionality Guide](FUNCTIONALITY-GUIDE.md) | Business, QA, trainers | User roles, booking flow, admin features, scenarios |
| [Technical Documentation](TECHNICAL-DOCUMENTATION.md) | Developers | Architecture, data model, Apex/LWC, security |
| [Git Version Control Guide](GIT-VERSION-CONTROL-GUIDE.md) | Developers, DevOps | Initialize repo, branching, commits, remote push, deploy workflow |

## Quick links

| Environment | Portal URL |
|-------------|------------|
| Production | https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana |
| Scratch (example) | https://dream-power-6497-dev-ed.scratch.my.site.com/urdushadikhanana |

## Deploy in one command

**New org (full metadata deploy):**

```powershell
cd C:\Users\PSK\Documents\OnlineReservation
sf org login web --alias my-target-org
.\deploy\urdu-shadikhana\scripts\deploy-full.ps1 -TargetOrg my-target-org
```

**Existing org (recent changes only):**

```powershell
.\deploy\urdu-shadikhana\scripts\deploy-delta.ps1 -TargetOrg my-target-org -RunTests
```

**Scratch org (creates site automatically):**

```powershell
.\scripts\deploy-urdu-shadi-khanana.ps1 -CreateScratchOrg
```
