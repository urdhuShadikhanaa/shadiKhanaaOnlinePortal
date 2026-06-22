# Screenshot capture guide for E2E Word document

## Auto-capture (public pages)

```powershell
cd demo-video
npm install
npx playwright install chromium
cd ..
node scripts/capture-doc-screenshots.js
```

Optional: set portal URL for a different org:

```powershell
$env:PORTAL_URL = "https://urdhushadikhanaa-dev-ed.develop.my.site.com/urdushadikhana"
node scripts/capture-doc-screenshots.js
```

## Manual capture (admin scenarios)

Log in as **System Administrator** and capture these screens. Save PNG files here using exact filenames:

| Filename | Screen |
|----------|--------|
| `05-booking-form-step1-dates.png` | Booking Request Form — step 1 |
| `06-calendar-date-picker.png` | When is your event? calendars |
| `07-availability-calendar-panel.png` | Right-side availability calendar |
| `10-booking-step2-event.png` | Event information step |
| `11-booking-step3-contact.png` | Contact information step |
| `12-booking-step4-review.png` | Review + estimated price |
| `13-booking-submit-success.png` | Success toast after submit |
| `14-sms-outbound-pending.png` | Salesforce Sms_Outbound__c list |
| `20-admin-booking-queue.png` | Administration → Booking Queue |
| `21-admin-confirm-booking.png` | Confirm booking action |
| `22-admin-deep-link-highlight.png` | Deep-linked booking highlighted |
| `23-admin-booking-report.png` | Booking Report |
| `24-admin-pricing.png` | Pricing section |
| `25-admin-branding.png` | Site Branding |
| `26-admin-sms-settings.png` | SMS Notifications |
| `27-admin-email-settings.png` | Email Notifications |
| `28-admin-login-notes.png` | Portal Login Notes |
| `29-admin-booking-data.png` | Booking Data tab |
| `15-android-gateway-app.png` | Android gateway app (phone) |
| `30-android-test-sms.png` | Android Test SMS success |
| `31-scheduled-jobs.png` | Setup → Scheduled Jobs |

## Regenerate Word document

```powershell
pip install python-docx
python scripts/generate-e2e-word-doc.py
```

Output: `docs/Urdu-Shadikhana-E2E-Functionality-Reference.docx`

## Publish beautiful gallery photos to the live portal

Captures high-resolution venue gallery images (2x DPI, color polish) and uploads them to **Administration → Site Branding → Gallery Photos** in the `urdhu` org.

```powershell
node scripts/publish-portal-gallery.js
```

Optional:

```powershell
$env:SKIP_CAPTURE = "1"   # upload existing files in docs/portal-gallery/ only
```

Gallery files are saved under `docs/portal-gallery/` (`exterior.jpg`, `interior.jpg`, `dining.jpg`).
