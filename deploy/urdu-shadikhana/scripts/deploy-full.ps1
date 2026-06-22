# Deploy full Urdu Shadikhana metadata to a target org using Metadata API (no package version).
# Usage:
#   .\deploy\urdu-shadikhana\scripts\deploy-full.ps1 -TargetOrg my-org-alias
#   .\deploy\urdu-shadikhana\scripts\deploy-full.ps1 -TargetOrg my-org-alias -RunTests

param(
    [Parameter(Mandatory = $true)]
    [string]$TargetOrg,
    [switch]$RunTests
)

$ErrorActionPreference = "Stop"
$DeployRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $DeployRoot)
$ForceApp = Join-Path $ProjectRoot "force-app\main\default"
$ExperiencePath = Join-Path $ForceApp "experiences\Urdu_Shadikhana1"
$CommunitiesSettings = Join-Path $ProjectRoot "package\config\Communities.settings-meta.xml"
$ExperienceSettings = Join-Path $ForceApp "settings\ExperienceBundle.settings-meta.xml"

function Invoke-SfDeploy {
    param(
        [string[]]$SourceDirs,
        [string]$Label,
        [string]$TestLevel = "NoTestRun",
        [switch]$Optional
    )

    Write-Host $Label
    $args = @("project", "deploy", "start", "--target-org", $TargetOrg, "--test-level", $TestLevel, "--ignore-conflicts", "--wait", "30")
    foreach ($dir in $SourceDirs) {
        if (-not (Test-Path $dir)) {
            if ($Optional) {
                Write-Host "  Skipped (path not found): $dir"
                return
            }
            throw "Deploy path not found: $dir"
        }
        $args += @("--source-dir", $dir)
    }

    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = sf @args 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorAction
    Write-Host $output

    if ($output -match "Status: Succeeded") {
        return
    }

    if ($output -match "Deploy ID:\s+(\w+)") {
        $jobId = $Matches[1]
        Start-Sleep -Seconds 4
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $report = sf project deploy report --job-id $jobId --target-org $TargetOrg 2>&1 | Out-String
        $ErrorActionPreference = $prevErrorAction
        if ($report -match "Succeeded") {
            Write-Host "  Deploy report confirms success for job $jobId"
            return
        }
    }

    if ($Optional) {
        Write-Host "  Warning: optional deploy step did not report success."
        return
    }

    throw "Deploy failed: $Label"
}

function Invoke-SafePermsetAssign {
    param([string]$PermsetName)

    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = sf org assign permset --name $PermsetName --target-org $TargetOrg 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorAction
    Write-Host $output.TrimEnd()
    if ($output -match "Duplicate PermissionSetAssignment") {
        Write-Host "  (already assigned - skipped)"
        return
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Permission set assignment failed: $PermsetName"
    }
}

Push-Location $ProjectRoot
try {
    Write-Host "Project root:  $ProjectRoot"
    Write-Host "Target org:    $TargetOrg"
    Write-Host ""

    if (Test-Path $CommunitiesSettings) {
        Invoke-SfDeploy -SourceDirs @($CommunitiesSettings) -Label "[1/6] Enabling Digital Experiences..." -Optional
    }

    if (Test-Path $ExperienceSettings) {
        Invoke-SfDeploy -SourceDirs @($ExperienceSettings) -Label "[2/6] Deploying Experience Bundle settings..." -Optional
    }

    $testLevel = if ($RunTests) { "RunLocalTests" } else { "NoTestRun" }

    Write-Host "Aborting pending Shadikhana scheduled jobs (if any)..."
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    sf apex run --file (Join-Path $DeployRoot "scripts\pre-deploy-abort-jobs.apex") --target-org $TargetOrg 2>&1 | Out-String | Write-Host
    $ErrorActionPreference = $prevErrorAction
    Start-Sleep -Seconds 3

    Invoke-SfDeploy -Label "[3/6] Deploying custom objects..." -TestLevel $testLevel -SourceDirs @(
        (Join-Path $ForceApp "objects\Shadikhana_Booking__c"),
        (Join-Path $ForceApp "objects\Shadikhana_Settings__c"),
        (Join-Path $ForceApp "objects\Shadikhana_Daily_Rate__c"),
        (Join-Path $ForceApp "objects\Portal_Banner__c")
    )

    Invoke-SfDeploy -Label "[4a/6] Deploying Apex classes..." -TestLevel $testLevel -SourceDirs @(
        (Join-Path $ForceApp "classes")
    )

    Invoke-SfDeploy -Label "[4b/6] Deploying LWC, app, permissions, and integrations..." -TestLevel $testLevel -SourceDirs @(
        (Join-Path $ForceApp "lwc\shadikhanaBookingPortal"),
        (Join-Path $ForceApp "lwc\shadikhanaLoginNotes"),
        (Join-Path $ForceApp "applications\Urdu_Shadikhana.app-meta.xml"),
        (Join-Path $ForceApp "tabs\Shadikhana_Booking__c.tab-meta.xml"),
        (Join-Path $ForceApp "tabs\Urdu_Shadikhana_Portal.tab-meta.xml"),
        (Join-Path $ForceApp "flexipages\Urdu_Shadikhana_Portal.flexipage-meta.xml"),
        (Join-Path $ForceApp "permissionsets\Shadikhana_Booking_User.permissionset-meta.xml"),
        (Join-Path $ForceApp "permissionsets\Shadikhana_Community_Booking.permissionset-meta.xml"),
        (Join-Path $ForceApp "permissionsets\Shadikhana_Guest_Portal.permissionset-meta.xml"),
        (Join-Path $ForceApp "permissionsets\Shadikhana_Twilio_Callout.permissionset-meta.xml"),
        (Join-Path $ForceApp "staticresources"),
        (Join-Path $ForceApp "cspTrustedSites"),
        (Join-Path $ForceApp "namedCredentials"),
        (Join-Path $ForceApp "externalCredentials")
    )

    $createSiteScript = Join-Path $DeployRoot "scripts\create-experience-site.ps1"
    if (Test-Path $createSiteScript) {
        Write-Host "[5/6] Creating/publishing Experience Cloud site..."
        & $createSiteScript -TargetOrg $TargetOrg
    } elseif (Test-Path $ExperiencePath) {
        Invoke-SfDeploy -SourceDirs @($ExperiencePath) -Label "[5/6] Deploying Experience Cloud pages..." -Optional
    } else {
        Write-Host "[5/6] Skipped Experience pages (bundle not found)."
    }

    Write-Host "[6/6] Assigning permission sets and running post-deploy Apex..."
    Invoke-SafePermsetAssign -PermsetName "Shadikhana_Booking_User"
    Invoke-SafePermsetAssign -PermsetName "Shadikhana_Twilio_Callout"

    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $apexOutput = sf apex run --file (Join-Path $DeployRoot "scripts\post-deploy.apex") --target-org $TargetOrg 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorAction
    Write-Host $apexOutput
    if ($apexOutput -notmatch "POST_DEPLOY_SETTINGS_ID=" -and $apexOutput -match "Error|Compilation failed|executeRuntimeFailure") {
        throw "Post-deploy Apex script failed."
    }

    $orgInfo = sf org display --target-org $TargetOrg --json | ConvertFrom-Json
    Write-Host ""
    Write-Host "Full deployment complete."
    Write-Host "Org:            $($orgInfo.result.username)"
    Write-Host "Instance:       $($orgInfo.result.instanceUrl)"
    Write-Host "Next steps:     See deploy\urdu-shadikhana\POST-DEPLOY-CHECKLIST.md"
}
finally {
    Pop-Location
}
