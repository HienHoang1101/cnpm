Alertmanager integration guide

This folder contains `alertmanager.yml` used by Alertmanager to route and send alerts.

Secrets / Webhooks

- The sample `alertmanager.yml` includes Slack receivers with placeholder webhook URLs.
- For production, never store actual webhooks in the repository. Use one of the following approaches:
  - Use your deployment tool (Helm / kustomize) to template the webhook value from a Secret.
  - Mount a file containing `alertmanager.yml` at runtime with the real webhook filled in.
  - Use environment variable substitution at container start time to populate the webhook.

Example (Docker Compose secret):

- Create a file `monitoring/secrets/alertmanager_slack_fastfood_url` containing the webhook URL.
- In `docker-compose.yml`, mount the secrets into the Alertmanager container and use a templating step to generate `alertmanager.yml` from `alertmanager.yml.tpl`.

Kubernetes (recommended) example using secret and Helm:

- Create Kubernetes Secret:
  kubectl create secret generic alertmanager-slack --from-literal=slack_webhook='https://hooks.slack.com/services/XXX/YYY/ZZZ'

- In Helm values for Alertmanager/chart, reference the secret value and set the receiver's `slack_configs[0].api_url` to the secret.

Testing alerts

- Use `amtool` or push a synthetic alert to Alertmanager to test routing and channels.
- Example:
  echo "[{'labels': {'alertname':'TestAlert','project':'fastfood_delivery'}, 'annotations': {'summary':'test','description':'desc'}}]" | curl -XPOST -H "Content-Type: application/json" --data @- http://localhost:9093/api/v1/alerts

If you want, tôi đã thêm một workflow tiện lợi để tạo config từ template:

- Template file: `monitoring/alertmanager/alertmanager.yml.tpl` (contains placeholders `@@SLACK_FASTFOOD@@` and `@@SLACK_DEFAULT@@`).
- Generator scripts:
  - Bash: `monitoring/alertmanager/generate_alertmanager.sh`
  - PowerShell: `monitoring/alertmanager/generate_alertmanager.ps1`

Usage (Linux / macOS):

```bash
cd monitoring/alertmanager
export SLACK_WEBHOOK_FASTFOOD="https://hooks.slack.com/services/XXX/YYY/AAA"
# optionally export SLACK_WEBHOOK_DEFAULT
./generate_alertmanager.sh
# Then run docker-compose (from repository root)
cd ../.. 
docker-compose up -d
```

Usage (Windows PowerShell):

```powershell
cd monitoring/alertmanager
$env:SLACK_WEBHOOK_FASTFOOD = 'https://hooks.slack.com/services/XXX/YYY/AAA'
# optionally set $env:SLACK_WEBHOOK_DEFAULT
.\generate_alertmanager.ps1
# Then run docker-compose from repo root
cd ..\..
docker-compose up -d
```

The scripts generate `monitoring/alertmanager/generated/alertmanager.yml` which you can mount into the Alertmanager container (the repository's `monitoring/docker-compose.yml` still mounts the repo `alertmanager/alertmanager.yml` by default). Replace that mount or edit `docker-compose.yml` to point to the generated file when deploying.

If you prefer, tôi có thể thêm a) a small wrapper that runs the generator and then starts `docker-compose`, or b) Helm/kustomize examples to read webhook values from Kubernetes Secrets.

Choose which you prefer and tôi sẽ tiếp tục.