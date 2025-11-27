param(
  [int]$Count = 100,
  [int]$KeepActive = 3,
  [string]$Target = 'http://localhost:52357',
  [string]$OutputDir = 'monitoring/grafana/dashboards'
)

Set-StrictMode -Version Latest

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

Write-Output "Registering $Count users against $Target"
for ($i = 1; $i -le $Count; $i++) {
  $regBody = @{ email = "authtest+$i@example.com"; password = "Password123!"; name = "Auth Test $i"; phone = "000000"; role = "customer" } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "$Target/api/auth/register" -Method Post -Body $regBody -ContentType 'application/json' -UseBasicParsing | Out-Null
    Write-Verbose "Registered authtest+$i@example.com"
  } catch {
    Write-Warning "Register ${i} failed: $($_.Exception.Message)"
  }
}

Write-Output "Starting $Count concurrent login jobs..."
$jobs = @()
for ($i = 1; $i -le $Count; $i++) {
  $body = @{ email = "authtest+$i@example.com"; password = "Password123!" } | ConvertTo-Json
  $jobs += Start-Job -ScriptBlock {
    param($b, $t)
    try {
      $res = Invoke-RestMethod -Uri "$t/api/auth/login" -Method Post -Body $b -ContentType 'application/json' -UseBasicParsing
      return $res
    } catch {
      return @{ success = $false; message = $_.Exception.Message }
    }
  } -ArgumentList $body, $Target
}

Write-Output "Waiting for login jobs to finish..."
$jobs | Wait-Job
Write-Output "Collecting login results..."
$results = $jobs | Receive-Job -ErrorAction SilentlyContinue
$tokens = @()
$savedResults = @()
foreach ($r in $results) {
  if ($null -ne $r -and $r.success -eq $true) {
    $tokens += $r.token
  }
  $savedResults += $r
}

$savedResults | ConvertTo-Json -Depth 5 | Out-File (Join-Path $OutputDir 'login-results.json') -Encoding utf8
Write-Output "Logins completed: $($tokens.Count) successful"

if ($tokens.Count -gt $KeepActive) {
  $toLogout = $tokens.Count - $KeepActive
  Write-Output "Logging out $toLogout sessions to reach $KeepActive active sessions"
  for ($i = 0; $i -lt $toLogout; $i++) {
    $tok = $tokens[$i]
    try {
      Invoke-RestMethod -Uri "$Target/api/auth/logout" -Method Post -Headers @{ Authorization = "Bearer $tok" } -UseBasicParsing | Out-Null
      Write-Verbose "Logged out token index $i"
    } catch {
      Write-Warning "Logout failed for token index ${i}: $($_.Exception.Message)"
    }
  }
  $tokens = $tokens | Select-Object -Last $KeepActive
}

$tokens | ConvertTo-Json | Out-File (Join-Path $OutputDir 'active-tokens.json') -Encoding utf8

Write-Output "Fetching /metrics from auth service"
(Invoke-WebRequest -Uri "$Target/metrics" -UseBasicParsing).Content | Out-File (Join-Path $OutputDir 'metrics-after.log') -Encoding utf8

Write-Output "Querying Prometheus for app_active_users_total"
try {
  $prom = Invoke-RestMethod -Uri "http://localhost:9090/api/v1/query?query=app_active_users_total" -UseBasicParsing
  $prom | ConvertTo-Json -Depth 6 | Out-File (Join-Path $OutputDir 'prom-query-after.json') -Encoding utf8
} catch {
  Write-Warning "Prometheus query failed: $($_.Exception.Message)"
}

Write-Output "Rendering Grafana panels to PNG"
$b64 = 'YWRtaW46YWRtaW4='
$panel2 = "http://localhost:3000/render/d-solo/auth-active-users/auth-active-users?panelId=2&from=now-1h&to=now&width=1200&height=600"
Invoke-WebRequest -Uri $panel2 -Headers @{ Authorization = "Basic $b64" } -OutFile (Join-Path $OutputDir 'auth-active-users-panel2-after.png') -UseBasicParsing
$panel1 = "http://localhost:3000/render/d-solo/auth-active-users/auth-active-users?panelId=1&from=now-1h&to=now&width=600&height=400"
Invoke-WebRequest -Uri $panel1 -Headers @{ Authorization = "Basic $b64" } -OutFile (Join-Path $OutputDir 'auth-active-users-panel1-after.png') -UseBasicParsing

Write-Output "Done. Files saved under $OutputDir"
