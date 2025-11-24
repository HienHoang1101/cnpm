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

If you want, tôi có thể:
- a) tạo một tập tin `alertmanager.yml.tpl` (template) và ví dụ script để inject webhook từ env var, hoặc
- b) hướng dẫn cụ thể cho Helm/kustomize để triển khai Alertmanager với secrets.

Bạn muốn tôi thực hiện (a) tạo template + inject script, hay (b) hướng dẫn Helm/kustomize cụ thể?