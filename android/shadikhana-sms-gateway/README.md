# Urdu Shadikhana Android SMS Gateway

Private Android app that polls Salesforce for pending booking SMS messages and sends them using the phone SIM card (no Twilio charges).

## Architecture

```text
Salesforce booking event
        -> Sms_Outbound__c (Pending)
        -> Android app polls REST API every 60s
        -> SmsManager -> SIM -> customer
        -> App acknowledges Sent/Failed in Salesforce
```

## 1. Open in Android Studio

1. Install [Android Studio](https://developer.android.com/studio)
2. **File -> Open** and select this folder:

   `android/shadikhana-sms-gateway`

3. Let Gradle sync finish (Android Studio will download the Gradle wrapper if needed)
4. Connect an Android phone with USB debugging enabled (use a physical phone for real SMS)

## 2. Build and install

Open the project in Android Studio, then:

**Build -> Build Bundle(s) / APK(s) -> Build APK(s)**

APK output:

`app/build/outputs/apk/debug/app-debug.apk`

Install on the gateway phone (sideload). This app is intended for **admin use only**.

## 3. Configure Salesforce (urdhu org)

Deploy the Salesforce metadata from the main project (`Sms_Outbound__c`, REST API, settings fields), then:

1. **Shadikhana Settings** (custom setting):
   - `SMS Provider` = `Android Gateway`
   - `SMS Gateway API Key` = a long random secret
   - `SMS Enabled` = checked

2. Assign permission set **Shadikhana SMS Gateway** to the admin user whose access token the phone will use.

3. Get an access token:

```powershell
sf org display --target-org urdhu --verbose
```

Copy **Instance Url** and **Access Token** (tokens expire; refresh when connection fails).

## 4. Configure the app

| Field | Example |
|-------|---------|
| Instance URL | `https://urdhushadikhanaa-dev-ed.develop.my.salesforce.com` |
| Access token | From `sf org display --verbose` |
| API key | Same as `SMS Gateway API Key` in Shadikhana Settings (`sk-shadikhana-gateway-change-me` unless changed) |
| Poll interval | `30` seconds |
| Test phone | Your mobile for **Send test SMS** |

**Important:** Use the **my.salesforce.com** instance URL, not the Experience Cloud **my.site.com** portal URL.

1. Tap **Save settings**
2. Tap **Test connection** — should show `Connected. Pending SMS: N` (N may be > 0 if bookings are queued)
3. Tap **Send test SMS** to verify SIM sending (this does not use Salesforce)
4. Tap **Poll now** to fetch and send queued SMS immediately
5. Tap **Start gateway** and keep the phone on charger + Wi-Fi

## Troubleshooting connection

| Symptom | Fix |
|---------|-----|
| `HTTP 401: Access token expired` | Run `sf org display --target-org urdhu --verbose`, copy a fresh **Access Token**, paste in app, Save |
| `HTTP 401: API key mismatch` | Match app API key to **Shadikhana Settings → SMS Gateway API Key** |
| `HTTP 404` or REST not found | Instance URL must end with `my.salesforce.com` |
| Test SMS works but no booking SMS | Tap **Poll now** or **Test connection**. If Pending SMS > 0 but Poll fails, check notification for error text |
| Pending SMS stuck in Salesforce | Phone is not polling successfully — refresh token and restart gateway |
| `Last error` shown on screen | Read the message; it explains token, API key, or URL problem |

CLI tokens from `sf org display` typically expire after a few hours. Refresh when polls fail.

## 5. Production tips

- Use a dedicated old Android phone as the SMS gateway
- Disable battery optimization for this app
- Set `SMS Provider` back to `Twilio` if the phone is offline
- Refresh the access token when polls fail with HTTP 401

## REST API

| Method | Path |
|--------|------|
| GET | `/services/apexrest/shadikhana/sms/v1/pending` |
| POST | `/services/apexrest/shadikhana/sms/v1/ack` |

Headers: `Authorization: Bearer <token>`, `X-Api-Key: <api_key>`
