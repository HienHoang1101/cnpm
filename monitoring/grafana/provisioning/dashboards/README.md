Place service-specific dashboards under separate folders for provisioning.

Example structure inside Grafana container provisioning directory (`/var/lib/grafana/dashboards`):

- `/var/lib/grafana/dashboards/auth/auth_service_dashboard.json`

The provider `auth-provider.yml` and `auth-dashboard-config.yml` instruct Grafana to load dashboards from the `Auth` folder.

When running Grafana with docker-compose, mount `monitoring/grafana/dashboards` to `/var/lib/grafana/dashboards` in the container.
