# Kubernetes Deployment Guide for Food Delivery System

This guide explains how to deploy the Cloud-Native Food Ordering and Delivery System on Kubernetes. Monitoring is first-class: bring up observability before rolling out the app services.

## Quickstart (monitoring-first)

1) Prepare environment  
- Copy `.env.example` to `.env`, set `DOCKER_REGISTRY` and credentials for every service.  
- Start a cluster (example: `minikube start --cpus 4 --memory 8g`).  

2) Deploy namespace and infrastructure  
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/mongodb.yaml
kubectl apply -f kubernetes/kafka.yaml
kubectl apply -f kubernetes/secrets.yaml
```

3) Install monitoring stack before app pods  
- Fast path: local demo via Docker Compose (includes Prometheus, Grafana, Loki, Promtail, Alertmanager):  
  ```bash
  docker-compose up -d prometheus grafana loki promtail alertmanager node-exporter
  ```  
- Kubernetes path (recommended for grading):  
  ```bash
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo add grafana https://grafana.github.io/helm-charts
  helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n food-delivery --create-namespace
  helm upgrade --install loki grafana/loki-stack -n food-delivery
  ```  
  Import dashboards from `monitoring/grafana/dashboards` into Grafana; point Prometheus at the services via service discovery or static targets.

4) Build and push images  
```bash
export DOCKER_REGISTRY=your-registry
docker-compose build
TAG_BASE=${DOCKER_REGISTRY}/$(whoami)
for svc in auth admin-service payment-service notification-service restaurant food-delivery-server order; do
  docker tag food-delivery_${svc} ${TAG_BASE}/${svc}:latest
  docker push ${TAG_BASE}/${svc}:latest
done
```

5) Deploy application services with kustomize  
```bash
kubectl apply -k kubernetes/
```

6) Smoke checks  
```bash
kubectl get pods -n food-delivery
kubectl logs -n food-delivery deployment/auth-service
kubectl get ing -n food-delivery
```

7) Basic rollback/scale  
```bash
kubectl rollout undo deployment/order-service -n food-delivery
kubectl scale deployment/order-service --replicas=3 -n food-delivery
```

## Prerequisites

- Kubernetes cluster (minikube, kind, cloud provider, etc.)
- kubectl installed and configured
- Docker installed (for building images)
- Docker registry to store images

## Setup Environment

1. Copy the `.env.example` file to `.env` and update it with your actual values:

```bash
cp .env.example .env
```

2. Update the DOCKER_REGISTRY value in `.env` to point to your Docker registry.

## Building and Pushing Docker Images

1. Build all service images:

```bash
# For each service
docker-compose build
```

2. Tag and push images to your registry:

```bash
export DOCKER_REGISTRY=your-registry-url

# For each service, tag and push
docker tag food-delivery_auth-service ${DOCKER_REGISTRY}/auth-service:latest
docker push ${DOCKER_REGISTRY}/auth-service:latest

# Repeat for other services
```

## Deploying to Kubernetes

1. Create the namespace and infrastructure:

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/mongodb.yaml
kubectl apply -f kubernetes/kafka.yaml
```

2. Create secrets (first time, update values):

```bash
kubectl create -f kubernetes/secrets.yaml
```

3. Deploy all services using kustomize:

```bash
kubectl apply -k kubernetes/
```

Alternatively, you can deploy services individually:

```bash
kubectl apply -f kubernetes/auth-service.yaml
kubectl apply -f kubernetes/restaurant-service.yaml
kubectl apply -f kubernetes/order-service.yaml
# ... etc for each service
```

## Accessing the Services

Once deployed, the services are accessible through the Ingress:

- Customer App: http://app.fooddelivery.com
- Restaurant Dashboard: http://restaurant.fooddelivery.com
- Admin Dashboard: http://admin.fooddelivery.com
- API Endpoints: http://api.fooddelivery.com

Note: You'll need to configure DNS or update your hosts file to point these domains to your Ingress controller's IP address.

## Monitoring and Maintenance

Check the status of deployments:

```bash
kubectl get deployments -n food-delivery
```

Check the status of pods:

```bash
kubectl get pods -n food-delivery
```

View logs for a specific service:

```bash
kubectl logs -f deployment/auth-service -n food-delivery
```

## Scaling Services

Scale any service by updating replicas:

```bash
kubectl scale deployment/order-service --replicas=3 -n food-delivery
```

## Updating Services

To update a service with a new image version:

```bash
kubectl set image deployment/auth-service auth-service=${DOCKER_REGISTRY}/auth-service:v2 -n food-delivery
```
