# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (microk8s, k3s, or cloud provider)
- kubectl configured to connect to your cluster
- Docker images built and pushed to registry

## Quick Start

### 1. Build Docker Images

```bash
# From project root
docker-compose build

# Tag images for your registry (example with local registry)
docker tag auth-ms localhost:5000/auth-ms:latest
docker tag device-ms localhost:5000/device-ms:latest
docker tag monitoring-ms localhost:5000/monitoring-ms:latest
docker tag iot-simulator localhost:5000/iot-simulator:latest
docker tag dashboard-ui localhost:5000/dashboard-ui:latest

# Push to registry
docker push localhost:5000/auth-ms:latest
# ... repeat for other images
```

### 2. Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f infrastructure/k8s/base/namespace.yaml

# Base & Storage
kubectl apply -f infrastructure/k8s/base/ingress.yaml
kubectl apply -f infrastructure/k8s/storage/
kubectl apply -f infrastructure/k8s/messaging/

# Services
kubectl apply -f infrastructure/k8s/services/

# Monitoring
kubectl apply -f infrastructure/k8s/monitoring/
```

### 3. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n iot-monitoring

# Check services
kubectl get svc -n iot-monitoring

# View logs
kubectl logs -f deployment/backend -n iot-monitoring
```

## Manifest Overview

| File | Component | Description |
|------|-----------|-------------|
| **base/** | | |
| namespace.yaml | Namespace | Isolates all resources |
| ingress.yaml | Nginx Ingress | External routing |
| **storage/** | | |
| db-*.yaml | PostgreSQL | Auth & device data storage |
| redis.yaml | Redis | Session caching |
| mongo.yaml | MongoDB | Telemetry time-series storage |
| **messaging/** | | |
| rabbitmq.yaml | RabbitMQ | Message queue |
| mosquitto.yaml | Mosquitto | MQTT broker |
| **services/** | | |
| backend-*.yaml | Auth Service | User authentication |
| device-management.yaml | Device Service | Device CRUD |
| iot-simulator.yaml | Simulator | Generates IoT data |
| frontend.yaml | Dashboard UI | React application |
| **monitoring/** | | |
| monitoring.yaml | Monitoring Service | Telemetry + Socket.IO |
| prometheus.yaml | Prometheus | Metrics collection |
| grafana.yaml | Grafana | Dashboards |

## Access Points (with Ingress)

| Service | Path |
|---------|------|
| Frontend | http://iot.local/ |
| Auth API | http://iot.local/auth |
| Device API | http://iot.local/devices |
| Monitoring API | http://iot.local/monitoring |
| Socket.IO | http://iot.local/socket.io |

## Scaling

```bash
# Scale monitoring service to 3 replicas
kubectl scale deployment monitoring --replicas=3 -n iot-monitoring
```

## Cleanup

```bash
kubectl delete namespace iot-monitoring
```
