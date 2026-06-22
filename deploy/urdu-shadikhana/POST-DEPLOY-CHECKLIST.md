# Post-Deploy Checklist — Urdu Shadikhana

Complete these steps after deploying metadata to a **new or existing** org.

## 1. Experience Cloud site

If the site does not exist yet:

```powershell
sf community create `
  --name "Urdu Shadikhana" `
  --template-name "Build Your Own" `
  --url-path-prefix urdushadikhana `
  --description "Urdu Shadikhana booking portal" `
  --target-org YOUR_ORG_ALIAS
```

Or run the all-in-one site script (create + deploy pages + publish + guest access):

```powershell
.\deploy\urdu-shadikhana\scripts\create-experience-site.ps1 -TargetOrg YOUR_ORG_ALIAS
```

`deploy-full.ps1` runs this automatically at step 5/6.

> Do **not** deploy `force-app\main\default\sites\Urdu_Shadikhana.site-meta.xml` to a new org — it references the production admin user. Site creation via CLI handles that.

## 2. Org-wide email address

1. Setup → **Organization-Wide Addresses**
2. Add and verify sender (e.g. `urdhushadikhanaa@gmail.com`)
3. Required for reliable outbound booking emails

## 3. Twilio SMS (optional)

1. Portal → **Administration → SMS Notifications**
2. Set:
   - SMS Enabled: **On**
   - Admin Mobile Number: `6364054881, 9849939703` (comma-separated)
   - Twilio Account SID, Auth Token, From Number
3. On Twilio **trial** accounts, verify each destination number

Or run post-deploy seed (updates defaults only):

```powershell
sf apex run --file deploy\urdu-shadikhana\scripts\post-deploy.apex --target-org YOUR_ORG_ALIAS
```

## 4. Portal settings (admin)

In **Administration** section, configure:

| Setting | Example |
|---------|---------|
| Admin Email | `urdhushadikhanaa@gmail.com` |
| Admin Mobile | `6364054881, 9849939703` |
| Default Daily Rate | `8000` |
| Portal Site URL | `https://<your-domain>.my.site.com/urdushadikhana` |
| Portal Login URL | `https://<your-domain>.my.site.com/urdushadikhana/login` |
| Hall seating capacity | `500` |

## 5. Permission sets

Assign to users:

| Permission Set | Who |
|----------------|-----|
| `Shadikhana_Booking_User` | System administrators |
| `Shadikhana_Community_Booking` | Community users |
| `Shadikhana_Guest_Portal` | Guest user (auto via post-deploy script) |
| `Shadikhana_Twilio_Callout` | Integration user / admin |

```powershell
sf org assign permset --name Shadikhana_Booking_User --target-org YOUR_ORG_ALIAS
sf org assign permset --name Shadikhana_Twilio_Callout --target-org YOUR_ORG_ALIAS
```

## 6. Guest access

Ensure guest user profile or permission set allows:

- Read/create on `Shadikhana_Booking__c`
- Read on `Shadikhana_Settings__c`, `Portal_Banner__c`, `Shadikhana_Daily_Rate__c`
- Apex class access for portal controller and public access classes

Run if not done by deploy script:

```powershell
sf apex run --file scripts\apex\assignGuestPortalAccess.apex --target-org YOUR_ORG_ALIAS
```

## 7. Named Credential (Twilio alternative)

If not storing Auth Token in custom settings:

1. Setup → **Named Credentials** → `Twilio_SMS`
2. Configure OAuth or password authentication for Twilio API

## 8. Verify deployment

```powershell
# Create test booking
sf apex run --file scripts\create-test-booking.apex --target-org YOUR_ORG_ALIAS

# Check settings
sf apex run --file scripts\apex\checkNotificationSettings.apex --target-org YOUR_ORG_ALIAS
```

### Smoke test in browser

1. Open portal Home page as guest
2. Submit a booking request with email address
3. Confirm admin receives SMS (both numbers) and email
4. Admin confirms booking in queue
5. Requester receives confirmation email

## 9. Scheduled jobs

Post-deploy script schedules cancelled-booking cleanup. Verify:

Setup → **Scheduled Jobs** → `ShadikhanaCancelledCleanupScheduler`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `--manifest` and `--source-dir` together | Fixed in `deploy-full.ps1` — uses `--source-dir` stages only |
| `Footer_Additional_Phone__c` missing in post-deploy | Run full deploy step 3 first (objects must deploy before post-deploy Apex) |
| Duplicate permission set assignment | Safe to ignore — script skips duplicates |
| `Missing message metadata.transfer:Finalizing` | Known Salesforce CLI bug — script checks deploy report for actual success |
| Apex deploy blocked by scheduled jobs | Script runs `pre-deploy-abort-jobs.apex` automatically; or enable **Allow deployments with Apex jobs** in Setup > Deployment Settings |
| SMS not received | Verify numbers in Twilio trial; check Admin Mobile format |
| Email not received | Verify org-wide email; check spam folder |
| Guest cannot submit | Assign `Shadikhana_Guest_Portal` permission set |
| Experience page blank | Redeploy `package/experience/` and publish site |
| Deploy fails on tests | Use `-RunTests` only in sandbox; production may need specified tests |
