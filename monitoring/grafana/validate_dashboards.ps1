<#
validate_dashboards.ps1
Validate JSON dashboards under monitoring/grafana/dashboards using PowerShell's ConvertFrom-Json.
Usage: run in PowerShell: `.	ools\validate_dashboards.ps1` or call from repo root.
#>
param(
  [string]$DashboardsPath = (Join-Path -Path $PSScriptRoot -ChildPath 'dashboards')
)

Write-Host "Validating dashboards under: $DashboardsPath"

$errors = 0

Get-ChildItem -Path $DashboardsPath -Recurse -Filter '*.json' | ForEach-Object {
  $file = $_.FullName
  Write-Host "Validating $file"
  try {
    $json = Get-Content -Path $file -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
  } catch {
    Write-Host "  -> Invalid JSON: $file" -ForegroundColor Red
    Write-Host "     $_"
    $errors++
    return
  }

  $hasUid = $false; $hasTitle = $false
  if ($null -ne $json.uid -and $json.uid -ne '') { $hasUid = $true }
  if ($null -ne $json.title -and $json.title -ne '') { $hasTitle = $true }

  if (-not $hasUid -or -not $hasTitle) {
    Write-Host "  -> Missing required 'uid' or 'title' in $file" -ForegroundColor Yellow
    $errors++
  } else {
    Write-Host "  -> OK (uid=$($json.uid) title=$($json.title))" -ForegroundColor Green
  }
}

if ($errors -ne 0) {
  Write-Host "Found $errors dashboard validation errors." -ForegroundColor Red
  exit 1
}

Write-Host "All dashboards validated successfully." -ForegroundColor Green
exit 0
