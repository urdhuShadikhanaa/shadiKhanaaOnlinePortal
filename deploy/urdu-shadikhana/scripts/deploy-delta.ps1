# Deploy recent Urdu Shadikhana changes to an existing org (delta manifest, no package version).
# Usage:
#   .\deploy\urdu-shadikhana\scripts\deploy-delta.ps1 -TargetOrg my-org-alias
#   .\deploy\urdu-shadikhana\scripts\deploy-delta.ps1 -TargetOrg my-org-alias -RunTests

param(
    [Parameter(Mandatory = $true)]
    [string]$TargetOrg,
    [switch]$RunTests
)

$ErrorActionPreference = "Stop"
$DeployRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $DeployRoot)
$Manifest = Join-Path $DeployRoot "manifest\package-delta.xml"

if (-not (Test-Path $Manifest)) {
    throw "Manifest not found: $Manifest"
}

$testLevel = if ($RunTests) { "RunSpecifiedTests" } else { "NoTestRun" }

$deployArgs = @(
    "project", "deploy", "start",
    "--manifest", $Manifest,
    "--target-org", $TargetOrg,
    "--test-level", $testLevel,
    "--ignore-conflicts",
    "--wait", "30"
)

if ($RunTests) {
    $deployArgs += @(
        "--tests", "ShadikhanaBookingControllerTest",
        "--tests", "ShadikhanaBookingEmailServiceTest",
        "--tests", "ShadikhanaBookingSmsServiceTest"
    )
}

Write-Host "Delta deploy to: $TargetOrg"
Write-Host "Manifest:        $Manifest"
Write-Host "Project root:    $ProjectRoot"
Write-Host ""

Push-Location $ProjectRoot
try {
    sf @deployArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Delta deploy failed."
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Delta deployment complete."
Write-Host "Update Admin Mobile in portal if needed: 6364054881, 9849939703"
