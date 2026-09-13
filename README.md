# IoT Monitoring Microservices — Cloud-Native Platform on Kubernetes

A production-grade IoT monitoring platform built with a microservices architecture, deployed on Kubernetes. Devices publish telemetry over MQTT, the platform ingests and stores it with polyglot persistence, detects anomalies in real time using Isolation Forest, and exposes a React dashboard with live WebSocket updates.

---

## Architecture overview

```
IoT Devices / Simulator
        │ MQTT (paho)
        ▼
  Mosquitto Broker  ──────────────────────────────────────┐
        │                                                  │
        ▼                                              RabbitMQ
 Device Management Service                                 │
  (FastAPI · PostgreSQL)                           Monitoring Service
  - device registry                               (FastAPI · MongoDB)
  - command dispatch                              - telemetry storage
  - MQTT listener                                 - time-series queries
        │                                                  │
        └──────────────┬───────────────────────────────────┘
                       │ HTTP (via Nginx gateway)
                       ▼
             Prediction Service
             (FastAPI · Isolation Forest)
             - anomaly detection
             - risk level scoring
                       │
                       ▼
              React Dashboard (TypeScript)
              - live telemetry (WebSocket)
              - device management
              - alert notifications
                       │
              Prometheus + Grafana
              - metrics scraping
              - dashboards
```

---

## Services

| Service | Port | Stack | Responsibility |
|---|---|---|---|
| **auth / signing** | 8000 | FastAPI · PostgreSQL · Redis | JWT auth, session management, Argon2id password hashing |
| **device-management** | 8001 | FastAPI · PostgreSQL · MQTT | Device registry, commands, MQTT event listener |
| **monitoring** | 8002 | FastAPI · MongoDB | Telemetry ingestion from RabbitMQ, time-series storage |
| **prediction-service** | 8003 | FastAPI · scikit-learn | Isolation Forest anomaly detection, risk scoring |
| **iot-simulator** | — | Python · paho-mqtt | Deterministic IoT device simulator, publishes to Mosquitto |
| **frontend** | 80 (nginx) | React · TypeScript · Tailwind | Real-time dashboard, auth, device + alert management |
| **gateway** | 8080 | Nginx | Reverse proxy, routes all traffic to backend services |
| **Mosquitto** | 1883 / 9001 | Eclipse Mosquitto | MQTT broker |
| **RabbitMQ** | 5672 / 15672 | RabbitMQ | Message queue between device-management and monitoring |
| **PostgreSQL** | 5432 | postgres:alpine | Auth + device data |
| **MongoDB** | 27017 | mongo | Time-series telemetry |
| **Redis** | 6379 | redis:alpine | Token blacklist / session cache |
| **Prometheus** | 9090 | prom/prometheus | Metrics scraping from all FastAPI services |
| **Grafana** | 3001 | grafana/grafana | Observability dashboards |
| **SonarQube** | 9000 | sonarqube:community | Static code analysis |

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend services | Python · FastAPI · uvicorn |
| Messaging | MQTT (Mosquitto) · RabbitMQ |
| Databases | PostgreSQL · MongoDB · Redis |
| ML / anomaly detection | scikit-learn · Isolation Forest |
| Frontend | React 18 · TypeScript · Tailwind CSS · Vite |
| Auth | JWT · Argon2id · Redis token blacklist |
| Observability | Prometheus · Grafana · prometheus-fastapi-instrumentator |
| Code quality | SonarQube |
| Containerization | Docker · docker-compose |
| Orchestration | Kubernetes (13 pods) |

---

## Kubernetes deployment

All manifests live under `infrastructure/k8s/`:

```
infrastructure/k8s/
├── base/
│   ├── namespace.yaml        # iot-monitoring namespace
│   └── ingress.yaml
├── services/                 # Deployment + Service for each microservice
│   ├── backend-deployment.yaml
│   ├── device-management-deployment.yaml
│   ├── iot-simulator-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── prediction-deployment.yaml
├── messaging/
│   ├── mosquitto-deployment.yaml
│   └── rabbitmq-deployment.yaml
├── monitoring/
│   ├── prometheus-deployment.yaml
│   ├── grafana-deployment.yaml
│   └── monitoring-deployment.yaml
└── storage/
    ├── db-deployment.yaml    # PostgreSQL
    ├── mongo.yaml
    └── redis.yaml
```

Deploy to a running cluster:

```bash
kubectl apply -f infrastructure/k8s/base/
kubectl apply -f infrastructure/k8s/storage/
kubectl apply -f infrastructure/k8s/messaging/
kubectl apply -f infrastructure/k8s/services/
kubectl apply -f infrastructure/k8s/monitoring/
```

---

## Getting started (Docker Compose)

### Prerequisites

- Docker + Docker Compose
- (Optional) a running Kubernetes cluster for K8s deployment

### 1. Clone and configure

```bash
git clone https://github.com/abdellahjebar/iot-monitoring-microservices.git
cd iot-monitoring-microservices
cp .env.example .env   # edit credentials if needed
```

Default `.env` values (change for production):

```
NAME_DB=db_auth
USER_DB=admin
PASSWORD_DB=1234
MONGO_USER=admin
MONGO_PASSWORD=1234
```

### 2. Start all services

```bash
docker compose up --build
```

| URL | Service |
|---|---|
| `http://localhost:8080` | Main gateway (dashboard + APIs) |
| `http://localhost:9090` | Prometheus |
| `http://localhost:3001` | Grafana (admin / admin) |
| `http://localhost:15672` | RabbitMQ management |
| `http://localhost:9000` | SonarQube |

### 3. Seed devices

```bash
python seed_devices.py
```

The IoT simulator starts automatically and begins publishing telemetry to Mosquitto. The monitoring service picks it up from RabbitMQ and stores it in MongoDB.

---

## Anomaly detection

The prediction service runs an **Isolation Forest** model trained on synthetic normal telemetry (temperature, humidity, CPU load). Each incoming reading gets a risk score and a classification:

| Score | Risk level |
|---|---|
| Normal range | LOW |
| Score < 0.1 | MEDIUM |
| Prediction = -1 | HIGH (anomaly) |

Results are returned synchronously via the prediction API and surfaced as alerts in the dashboard.

---

## Project structure

```
iot-monitoring-microservices/
├── services/
│   ├── signing/               # Auth service (JWT · Argon2id · Redis)
│   ├── device-management/     # Device registry + MQTT listener
│   ├── monitoring/            # Telemetry ingestion + MongoDB storage
│   ├── prediction-service/    # Isolation Forest anomaly detection
│   ├── iot-simulator/         # Deterministic MQTT publisher
│   ├── prometheus/            # prometheus.yml config
│   └── grafana/               # Provisioning dashboards
├── frontend/                  # React + TypeScript dashboard
├── infrastructure/
│   ├── k8s/                   # Kubernetes manifests
│   ├── mosquitto/             # MQTT broker config
│   └── nginx/                 # Gateway routing config
├── docker-compose.yml
├── seed_devices.py
└── sonar-project.properties
```

---

## Security

- **Password hashing**: Argon2id (memory-hard, resistant to GPU cracking)
- **Session management**: JWT with Redis-backed token blacklist for immediate revocation
- **Zero-Trust posture**: each service authenticates independently; no implicit trust between pods
- **Secrets**: injected via environment variables, never hardcoded

---

## Observability

Every FastAPI service exposes a `/metrics` endpoint via `prometheus-fastapi-instrumentator`. Prometheus scrapes all services on a shared internal network. Grafana dashboards are provisioned automatically from `services/grafana/provisioning/`.
