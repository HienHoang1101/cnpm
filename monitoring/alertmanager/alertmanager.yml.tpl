---
global:
  resolve_timeout: 5m

route:
  receiver: 'slack'
  group_by: ['alertname', 'service', 'project']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 3h
  routes:
    - match:
        project: "fastfood_delivery"
      receiver: 'slack-fastfood'
      continue: false

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: '@@SLACK_DEFAULT@@'
        channel: '#alerts'
        text: |-
          [{{ .Status }}] {{ .CommonAnnotations.summary }}
          {{ .CommonAnnotations.description }}
          *Labels:* {{ range $k, $v := .CommonLabels }}{{$k}}={{$v}} {{end}}

  - name: 'slack-fastfood'
    slack_configs:
      - api_url: '@@SLACK_FASTFOOD@@'
        channel: '#fastfood-alerts'
        text: |-
          [{{ .Status }}] {{ .CommonAnnotations.summary }}
          {{ .CommonAnnotations.description }}
          *Labels:* {{ range $k, $v := .CommonLabels }}{{$k}}={{$v}} {{end}}

templates: []
