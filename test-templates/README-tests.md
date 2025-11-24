Unit test scaffolds and how to run them

This folder contains general instructions and conventions for the unit-test templates added into each backend service.

How the scaffolds work
- Each service gets a minimal Jest test that:
  - mounts the service's router(s) on a local express app (so we don't start the real server)
  - exposes a synthetic `/health` and `/metrics` endpoint when needed
  - runs two basic checks: health returns 200 and metrics returns prometheus text

Running tests
- Most services already have a `test` / `test:unit` script in their `package.json`. Run tests per-service:

```powershell
cd ./auth
npm ci
npm test
```

To run all service tests from repo root you can run this helper (PowerShell):

```powershell
# from repo root
Get-ChildItem -Directory -Filter "*" | Where-Object { Test-Path "$($_.FullName)\package.json" } | ForEach-Object {
  Push-Location $_.FullName
  if (Test-Path "package.json") {
    if ((Get-Content package.json) -match 'test') {
      Write-Host "Running tests in $($_.Name)"
      npm ci; npm test
    } else { Write-Host "No test script in $($_.Name)" }
  }
  Pop-Location
}
```

Next steps
- Replace placeholder assertions with real, domain-specific tests (route behavior, controller logic, validation, DB mocking using in-memory Mongo or jest mocks).
