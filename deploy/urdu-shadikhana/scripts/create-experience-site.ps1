# Create, configure, and publish the Urdu Shadikhana Experience Cloud site.
# Usage:
#   .\deploy\urdu-shadikhana\scripts\create-experience-site.ps1 -TargetOrg urdhu

param(
    [Parameter(Mandatory = $true)]
    [string]$TargetOrg,
    [string]$SiteName = "Urdu Shadikhana",
    [string]$UrlPathPrefix = "urdushadikhana",
    [int]$ProvisionWaitSeconds = 75
)

$ErrorActionPreference = "Stop"
$DeployRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $DeployRoot)
$ExperiencePath = Join-Path $ProjectRoot "force-app\main\default\experiences\Urdu_Shadikhana1"

function Get-NetworkCount {
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $json = sf data query --query "SELECT COUNT() FROM Network WHERE UrlPathPrefix = '$UrlPathPrefix'" --target-org $TargetOrg --json 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorAction
    $result = $json | ConvertFrom-Json
    if ($result.status -ne 0) {
        throw "Failed to query Network records: $($result.message)"
    }
    return [int]$result.result.totalSize
}

function Wait-BackgroundJob {
    param([string]$JobId, [int]$MaxWaitSeconds = 180)

    $elapsed = 0
    while ($elapsed -lt $MaxWaitSeconds) {
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $json = sf data query --query "SELECT Status FROM BackgroundOperation WHERE Id = '$JobId'" --target-org $TargetOrg --json 2>&1 | Out-String
        $ErrorActionPreference = $prevErrorAction
        $result = $json | ConvertFrom-Json
        $status = $result.result.records[0].Status
        if ($status -eq "Complete" -or $status -eq "Failed") {
            if ($status -eq "Failed") {
                throw "Background job $JobId failed."
            }
            return
        }
        Start-Sleep -Seconds 10
        $elapsed += 10
    }
    Write-Host "  Warning: timed out waiting for job $JobId (continuing)."
}

Push-Location $ProjectRoot
try {
    Write-Host "Target org: $TargetOrg"
    $networkCount = Get-NetworkCount

    if ($networkCount -eq 0) {
        Write-Host "Creating Experience Cloud site '$SiteName'..."
        $prevErrorAction = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $createJson = sf community create `
            --name $SiteName `
            --template-name "Build Your Own" `
            --url-path-prefix $UrlPathPrefix `
            --description "Urdu Shadikhana booking portal" `
            --target-org $TargetOrg `
            --json 2>&1 | Out-String
        $ErrorActionPreference = $prevErrorAction
        $create = $createJson | ConvertFrom-Json
        if ($create.status -ne 0) {
            throw "Site creation failed: $($create.message)"
        }
        Write-Host "  Job ID: $($create.result.jobId)"
        Wait-BackgroundJob -JobId $create.result.jobId
        Start-Sleep -Seconds $ProvisionWaitSeconds
    } else {
        Write-Host "Site already exists (UrlPathPrefix=$UrlPathPrefix)."
    }

    if (-not (Test-Path $ExperiencePath)) {
        throw "Experience bundle not found: $ExperiencePath"
    }

    Write-Host "Deploying Experience Cloud pages..."
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $deployOutput = sf project deploy start `
        --source-dir $ExperiencePath `
        --target-org $TargetOrg `
        --ignore-conflicts `
        --wait 30 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorAction
    Write-Host $deployOutput
    if ($deployOutput -notmatch "Succeeded") {
        throw "Experience bundle deploy did not succeed."
    }

    Write-Host "Publishing site..."
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $publishOutput = sf community publish --name $SiteName --target-org $TargetOrg 2>&1 | Out-String
    $ErrorActionPreference = $prevErrorAction
    Write-Host $publishOutput

    if ($publishOutput -match "Job Id\s+\|\s+(\w+)") {
        Wait-BackgroundJob -JobId $Matches[1]
    }

    Write-Host "Assigning guest portal permission set..."
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    sf apex run --file (Join-Path $ProjectRoot "scripts\apex\assignGuestPortalAccess.apex") --target-org $TargetOrg 2>&1 | Out-String | Write-Host
    $ErrorActionPreference = $prevErrorAction

    $orgInfo = sf org display --target-org $TargetOrg --json | ConvertFrom-Json
    $instanceHost = ([Uri]$orgInfo.result.instanceUrl).Host -replace '\.my\.salesforce\.com$', '.my.site.com'
    $portalUrl = "https://$instanceHost/$UrlPathPrefix"
    Write-Host ""
    Write-Host "Experience site ready."
    Write-Host "Portal URL:       $portalUrl"
    Write-Host "Portal Login URL: $portalUrl/login"
    Write-Host ""
    Write-Host "Update Shadikhana_Settings__c Portal_Site_URL__c and Portal_Login_URL__c in Administration."
}
finally {
    Pop-Location
}
