
Place service-specific dashboards under separate folders for provisioning.

Example structure inside Grafana container provisioning directory (`/var/lib/grafana/dashboards`):

- `/var/lib/grafana/dashboards/auth/auth_service_dashboard.json`
- `/var/lib/grafana/dashboards/order/order_service_dashboard.json`
- `/var/lib/grafana/dashboards/payment/payment_service_dashboard.json`
- `/var/lib/grafana/dashboards/notification/notification_service_dashboard.json`

Each service gets its own subfolder; provisioning providers can point to subfolders or a top-level dashboards folder. The existing `dashboard.yml` provider loads all files under `/var/lib/grafana/dashboards` so these will be imported automatically.

The provider `auth-provider.yml` and `auth-dashboard-config.yml` instruct Grafana to load dashboards from the `Auth` folder; you can add similar provider files per service if you prefer grouping them in Grafana's UI by folder.

When running Grafana with docker-compose, mount `monitoring/grafana/dashboards` to `/var/lib/grafana/dashboards` in the container. After Grafana starts, the new dashboards will be available in the UI.

Validation

- Use `monitoring/grafana/validate_dashboards.sh` to validate JSON dashboards before deploying. Requires `jq`.

Provisioning providers

- Added per-service provider files under `monitoring/grafana/provisioning/dashboards/` for `Auth`, `Admin`, `Order`, `Payment`, `Notification`, `Restaurant`, and `Food-Delivery-Server`. These providers map each service folder to a Grafana folder name.
