Simulate Logins (PowerShell)

This folder contains `simulate-logins.ps1`, a PowerShell script to register and log in test users against the Auth service, then optionally reduce active sessions so a desired number remain.

Usage (PowerShell):

```powershell
# Default: 100 users, keep 3 active
.\scripts\simulate-logins.ps1

# Custom count, keep 3 active
.\scripts\simulate-logins.ps1 -Count 200 -KeepActive 3

# Use a different auth target
.\scripts\simulate-logins.ps1 -Count 50 -KeepActive 3 -Target 'http://localhost:52357'
```

What the script does:
- Registers `authtest+N@example.com` users (password `Password123!`).
- Performs concurrent logins for the created users and saves results to `monitoring/grafana/dashboards/login-results.json`.
- Logs out users so only `KeepActive` sessions remain.
- Saves surviving tokens to `monitoring/grafana/dashboards/active-tokens.json`.
- Saves the Auth `/metrics` output to `monitoring/grafana/dashboards/metrics-after.log`.
- Queries Prometheus for `app_active_users_total` and saves the result to `monitoring/grafana/dashboards/prom-query-after.json`.
- Renders Grafana panels and stores PNGs under `monitoring/grafana/dashboards/`.

Notes & safety:
- The script uses the Auth endpoints implemented in this repo. It expects `/api/auth/register`, `/api/auth/login`, and a protected `/api/auth/logout` that accepts the JWT in the `Authorization: Bearer <token>` header.
- The script performs network requests against the `Target` address. Run only against a local/dev instance.
- Tokens are saved to disk for convenience; remove them if you don't want these stored.

If you want a non-PowerShell alternative (Node.js or k6), tell me which format you prefer and I will add it.
