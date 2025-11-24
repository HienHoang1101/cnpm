Monitoring overview for fastfood_delivery

This folder contains Prometheus, Grafana and Alertmanager configuration used for project monitoring.

Files:

- `prometheus.yml`: Prometheus scrape configuration.
- `prometheus_rules.yml`: Alerting rules used by Prometheus Alertmanager. Rules include `project` labels so Alertmanager can route alerts per-project.
- `alertmanager/alertmanager.yml`: Routing configuration for alerts — we route `project==fastfood_delivery` to a dedicated Slack receiver `slack-fastfood`.
- `grafana/dashboards/fastfood_dashboard.json`: Example Grafana dashboard (overview: latency, request rate, CPU, memory).

Guidance to manage multiple projects

- Ensure each rule includes a `project` label when you want per-project routing.
- Use `group_by: ['project', 'alertname']` in Alertmanager `route` to keep alerts grouped per project.
- Create a dedicated receiver per project (Slack channel, PagerDuty service, etc.), and add a child route that matches `project: "<your_project>"` and points to that receiver.

Adding new alerts

- Place alerts in `prometheus_rules.yml` grouped logically. Use `project` label to scope alerts to a given product.
- Keep `for` durations conservative (1-5 minutes) to reduce noise, increase for flaky scrapes.

Grafana

- The `fastfood_dashboard.json` provides an overview. Import it into Grafana via the UI or provisioning files in `monitoring/grafana/provisioning`.

Alert examples added

- `ServiceDown`: triggers when `up` = 0 for targets with `job=~".*-service"`.
- `High5xxErrorRate`: percent 5xx errors in last 5m for `project=fastfood_delivery`.
- `HighP95Latency`: P95 latency > 1s for `project=fastfood_delivery`.
- `MissingMetrics`: triggers if `up` == 0 or `http_request_duration_ms_count` is absent for the `fastfood_delivery` project.

Next steps

- Provide real Slack webhook URLs (or other receivers) in `alertmanager/alertmanager.yml` via secrets or environment replacement during deployment.
- Add additional dashboards per service (detailed views) and per-team dashboards.
- Consider adding SLOs and recording rules for long-term metrics aggregation.
