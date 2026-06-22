# Deploy Urdu Shadi Khanana portal to a Salesforce org.
# Usage:
#   .\scripts\deploy-urdu-shadi-khanana.ps1 -CreateScratchOrg
#   .\scripts\deploy-urdu-shadi-khanana.ps1 -TargetOrg urdushadikhanana

param(
    [string]$TargetOrg = "urdushadikhanana",
    [switch]$CreateScratchOrg,
    [string]$DevHub = "Learning org"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ManifestPath = Join-Path $Root "manifest\urdu-shadi-khanana-full-package.xml"
$ExperiencePath = Join-Path $Root "package\experience\Urdu_Shadi_Khanana1"
if (-not (Test-Path $ExperiencePath)) {
    $ExperiencePath = Join-Path $Root "retrieve-scratch\unpackaged\unpackaged\experiences\Urdu_Shadi_Khanana1"
}
$CommunitiesSettings = Join-Path $Root "config\deploy-settings\Communities.settings-meta.xml"
$ExperienceSettings = Join-Path $Root "force-app\main\default\settings\ExperienceBundle.settings-meta.xml"

function Get-OrgUsername {
    param([string]$Alias)
    $json = sf org display --target-org $Alias --json | ConvertFrom-Json
    return $json.result.username
}

if ($CreateScratchOrg) {
    sf org create scratch `
        --definition-file (Join-Path $Root "config\urdu-shadi-khanana-scratch-def.json") `
        --alias $TargetOrg `
        --duration-days 30 `
        --target-dev-hub $DevHub

    sf project deploy start --source-dir $CommunitiesSettings --target-org $TargetOrg --wait 30
    sf project deploy start --source-dir $ExperienceSettings --target-org $TargetOrg --wait 30

    sf community create `
        --name "Urdu Shadi Khanana" `
        --template-name "Build Your Own" `
        --url-path-prefix urdushadikhanana `
        --description "Urdu Shadi Khanana booking portal" `
        --target-org $TargetOrg

    Write-Host "Waiting 60 seconds for Experience Cloud site creation..."
    Start-Sleep -Seconds 60
}

Write-Host "Deploying custom objects..."
sf project deploy start `
    --source-dir (Join-Path $Root "force-app\main\default\objects\Shadikhana_Booking__c") `
    --source-dir (Join-Path $Root "force-app\main\default\objects\Shadikhana_Settings__c") `
    --source-dir (Join-Path $Root "force-app\main\default\objects\Shadikhana_Daily_Rate__c") `
    --source-dir (Join-Path $Root "force-app\main\default\objects\Portal_Banner__c") `
    --target-org $TargetOrg `
    --wait 30

Write-Host "Deploying Apex, LWC, app, permission sets, and integrations..."
sf project deploy start `
    --source-dir (Join-Path $Root "force-app\main\default\classes") `
    --source-dir (Join-Path $Root "force-app\main\default\lwc\shadikhanaBookingPortal") `
    --source-dir (Join-Path $Root "force-app\main\default\lwc\shadikhanaLoginNotes") `
    --source-dir (Join-Path $Root "force-app\main\default\applications\Urdu_Shadikhana.app-meta.xml") `
    --source-dir (Join-Path $Root "force-app\main\default\tabs") `
    --source-dir (Join-Path $Root "force-app\main\default\flexipages\Urdu_Shadikhana_Portal.flexipage-meta.xml") `
    --source-dir (Join-Path $Root "force-app\main\default\permissionsets\Shadikhana_Booking_User.permissionset-meta.xml") `
    --source-dir (Join-Path $Root "force-app\main\default\permissionsets\Shadikhana_Community_Booking.permissionset-meta.xml") `
    --source-dir (Join-Path $Root "force-app\main\default\permissionsets\Shadikhana_Guest_Portal.permissionset-meta.xml") `
    --source-dir (Join-Path $Root "force-app\main\default\permissionsets\Shadikhana_Twilio_Callout.permissionset-meta.xml") `
    --source-dir (Join-Path $Root "force-app\main\default\staticresources") `
    --source-dir (Join-Path $Root "force-app\main\default\cspTrustedSites") `
    --source-dir (Join-Path $Root "force-app\main\default\namedCredentials") `
    --source-dir (Join-Path $Root "force-app\main\default\externalCredentials") `
    --target-org $TargetOrg `
    --test-level NoTestRun `
    --ignore-conflicts `
    --wait 30

if (Test-Path $ExperiencePath) {
    Write-Host "Deploying Experience Cloud pages with booking portal..."
    sf project deploy start `
        --source-dir $ExperiencePath `
        --target-org $TargetOrg `
        --test-level NoTestRun `
        --ignore-conflicts `
        --wait 30
}

sf org assign permset --name Shadikhana_Booking_User --target-org $TargetOrg
sf org assign permset --name Shadikhana_Twilio_Callout --target-org $TargetOrg
sf apex run --file (Join-Path $Root "scripts\seed-sms-settings.apex") --target-org $TargetOrg
sf apex run --file (Join-Path $Root "scripts\apex\assignGuestPortalAccess.apex") --target-org $TargetOrg
sf apex run --file (Join-Path $Root "scripts\apex\schedule-cancelled-cleanup.apex") --target-org $TargetOrg
sf community publish --name "Urdu Shadi Khanana" --target-org $TargetOrg

$orgInfo = sf org display --target-org $TargetOrg --json | ConvertFrom-Json
$instanceUrl = $orgInfo.result.instanceUrl
Write-Host ""
Write-Host "Deployment complete."
Write-Host "Org alias:      $TargetOrg"
Write-Host "Login:          $instanceUrl"
Write-Host "Portal URL:     $instanceUrl/urdushadikhanana"
Write-Host "Package file:   manifest/urdu-shadi-khanana-full-package.xml"
