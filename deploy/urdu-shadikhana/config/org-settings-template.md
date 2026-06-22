# Org Settings Template — Urdu Shadikhana

Copy these values into **Shadikhana_Settings__c** (Custom Settings → Manage → Org Defaults) or via portal **Administration** after deploy.

Replace `<your-domain>` with the target org's Experience Cloud domain.

## Required for notifications

| Field | Example value | Notes |
|-------|---------------|-------|
| `Admin_Email__c` | `urdhushadikhanaa@gmail.com` | Receives new booking alerts |
| `Email_Enabled__c` | `true` | Master email switch |
| `SMS_Enabled__c` | `true` | Master SMS switch |
| `Admin_Mobile_Number__c` | `6364054881, 9849939703` | Comma-separated; one SMS per number |

## Twilio (SMS)

| Field | Example | Notes |
|-------|---------|-------|
| `Twilio_Account_SID__c` | `ACxxxxxxxx` | From Twilio console |
| `Twilio_Auth_Token__c` | `(secret)` | Or use Named Credential |
| `Twilio_From_Number__c` | `+15709191526` | Twilio phone number |

## Portal URLs

| Field | Example |
|-------|---------|
| `Portal_Site_URL__c` | `https://<your-domain>.my.site.com/urdushadikhana` |
| `Portal_Login_URL__c` | `https://<your-domain>.my.site.com/urdushadikhana/login` |

## Pricing / hall

| Field | Default |
|-------|---------|
| `Default_Daily_Rate__c` | `8000` |
| `Hall_Seating_Capacity__c` | `500` |
| `Hall_Comfortable_Guests__c` | `350` |
| `Hall_Decoration_Charge__c` | `25000` |
| `Hall_Catering_Charge_Per_Guest__c` | `450` |

## Footer / secondary contact

| Field | Example |
|-------|---------|
| `Footer_Additional_Phone__c` | `9652741400` |
| Also receives admin SMS if different from primary list |

## Optional — ntfy push

| Field | Example |
|-------|---------|
| `Notifications_Enabled__c` | `true` |
| `Ntfy_Topic__c` | `urdu-shadikhana-alerts` |
| `Ntfy_Server_URL__c` | `https://ntfy.sh` |
| `Ntfy_Access_Token__c` | `(optional)` |

## Portal login (admin hints on login page)

| Field | Example |
|-------|---------|
| `Portal_Admin_Username__c` | `admin@yourorg.com` |
| `Portal_Admin_Password__c` | `(hint only, not real password)` |
| `Portal_Login_Notes__c` | Free text shown on login page |

## Apex seed (quick apply)

```powershell
sf apex run --file deploy\urdu-shadikhana\scripts\post-deploy.apex --target-org YOUR_ORG_ALIAS
```

Edit `post-deploy.apex` before running if target org needs different values.
