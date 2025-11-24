param(
  [string]$SlackFastfood = $env:SLACK_WEBHOOK_FASTFOOD,
  [string]$SlackDefault = $env:SLACK_WEBHOOK_DEFAULT
)

if (-not $SlackFastfood) {
  Write-Error "SLACK_WEBHOOK_FASTFOOD environment variable is not set. Exiting."; exit 2
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$template = Join-Path $here 'alertmanager.yml.tpl'
$outdir = Join-Path $here 'generated'
if (-not (Test-Path $outdir)) { New-Item -ItemType Directory -Path $outdir | Out-Null }
$outfile = Join-Path $outdir 'alertmanager.yml'

$slackDefault = if ($SlackDefault) { $SlackDefault } else { '@@SLACK_DEFAULT@@' }

(Get-Content $template) -replace '@@SLACK_FASTFOOD@@', [Regex]::Escape($SlackFastfood) -replace '@@SLACK_DEFAULT@@', [Regex]::Escape($slackDefault) | Set-Content $outfile -NoNewline

Write-Host "Generated $outfile"
Write-Host "Mount it into Alertmanager container: ./monitoring/alertmanager/generated/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro"
