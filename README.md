# Neon Runner

A small neon-styled browser game: pilot a ship left and right, dodge
falling asteroids, and survive as long as you can. That's the whole
game, on purpose.

Neon Runner is not the point of this repository. It exists to be a
realistic, simple application workload - a frontend, a backend, some
metrics, some health checks - for a separate **GitOps-Driven
Kubernetes Platform with Observability & Security Guardrails** that
layers Docker, Kubernetes, Helm, ArgoCD, Prometheus, Grafana, and
Trivy on top of it. Everything below describes what lives *in this
repo*; the platform pieces (Kubernetes manifests, Helm charts, ArgoCD,
Prometheus, Grafana, Trivy) are **not implemented here** - see
[Kubernetes deployment](#8-how-this-is-intended-to-be-deployed-to-kubernetes).

```
neon-runner/
├── frontend/     React + Vite + TypeScript game client
├── backend/      FastAPI service (stats, metrics, health checks)
├── docker-compose.yml
└── .env.example
```

---

## 1. What Neon Runner is

- **Frontend**: a React/TypeScript game rendered with plain HTML/CSS
  (no canvas, no game engine). Move with `←`/`→` or `A`/`D`. Falling
  asteroids get faster and more frequent as your score climbs. High
  score is kept in the browser's `localStorage` - there are no
  accounts and no game database.
- **Backend**: a small FastAPI service that records anonymous,
  aggregate play statistics (`games_started`, `games_completed`,
  `highest_score`, `average_score`), exposes Prometheus metrics, and
  logs structured, one-line-per-request logs. The game is playable
  even if this backend is unreachable - it just won't contribute to
  the stats or metrics, and the frontend shows a small "offline mode"
  indicator when that happens.

## 2. Running locally (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt   # includes test deps
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive API docs.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. By default the frontend calls the
backend at the same origin; for local dev, set `VITE_API_URL` (see
`.env.example`) or create `frontend/.env.local` with:

```
VITE_API_URL=http://localhost:8000
```

## 3. Running with Docker

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`

`docker-compose.yml` builds two images from the two Dockerfiles in
this repo (`frontend/Dockerfile`, `backend/Dockerfile`) and wires the
frontend's build-time `VITE_API_URL` to the backend's exposed port.
Nothing here is meant to be a production Kubernetes substitute - it's
for local development and for sanity-checking the same images the
platform project will later deploy.

## 4. API endpoints

| Method | Path                | Purpose                                             |
|--------|---------------------|------------------------------------------------------|
| GET    | `/health`           | Liveness - is the process up?                        |
| GET    | `/ready`             | Readiness - can the API serve traffic?                |
| GET    | `/api/stats`         | Aggregate anonymous play stats                        |
| GET    | `/api/leaderboard`   | Top 10 scores recorded this process's lifetime        |
| POST   | `/api/game/start`    | Starts a session, returns a `session_id`               |
| POST   | `/api/game/end`      | Ends a session with a final score                      |
| GET    | `/metrics`           | Prometheus exposition format                           |
| GET    | `/api/test/error`    | **Demo only** - always returns HTTP 500                |
| GET    | `/api/test/slow`     | **Demo only** - always delays the response              |

### `/health`

```json
{ "status": "healthy" }
```

### `/ready`

```json
{ "status": "ready" }
```

The `/api/test/*` routes are not part of the game; they exist purely
so the observability platform has something reliable to demonstrate
against (see below).

## 5. Metrics & Logging

Exposed at `GET /metrics` in standard Prometheus exposition format:

- `game_sessions_total` - counter, incremented on `/api/game/start`
- `game_sessions_completed_total` - counter, incremented on `/api/game/end`
- `game_errors_total{category}` - counter, incremented by the demo error route
- `api_requests_total{method,endpoint,status}` - counter for every request
- `api_request_duration_seconds{method,endpoint}` - histogram of request latency
- `api_errors_total{method,endpoint,status}` - counter for every 5xx response

Labels are deliberately low-cardinality: `endpoint` is the route
*template* (e.g. `/api/game/end`), never a raw URL with dynamic
segments, and there are no per-user or per-session labels.

### Logging (stdout)

The backend logs one line per request to stdout (`docker logs` /
`kubectl logs` friendly), plus explicit events for application
startup/shutdown, game sessions starting and completing, and unhandled
errors:

```
2026-09-07 06:58:29 INFO neon_runner.main Application startup (app_env=development)
2026-09-07 06:58:30 INFO neon_runner.game Game started (session_id=...)
2026-09-07 06:58:31 ERROR neon_runner.main GET /api/test/error -> 500 (0.3ms)
```

Successful requests log at `INFO`, 5xx responses log at `ERROR`, and
unhandled exceptions are logged with the full traceback server-side
while the client only ever receives a generic `{"detail": "Internal
server error"}` - internal details never leak into an API response.
Log verbosity is controlled by the `LOG_LEVEL` environment variable.
Nothing here ever logs passwords, secrets, or tokens (there are none
in this app).

### Observability demo script

Once this app is deployed behind Prometheus/Grafana (by the platform
project), these are the demonstrations it's designed to support:

- **Normal traffic**: play the game a few times - `game_sessions_total`,
  `api_requests_total`, and request-rate panels should move.
- **Error rate**: call `GET /api/test/error` repeatedly - `game_errors_total`,
  `api_errors_total`, and the error-rate portion of
  `api_requests_total{status="500"}` should spike, ideally firing a
  Grafana alert.
- **Latency**: call `GET /api/test/slow` - `api_request_duration_seconds`
  should show the added latency.
- **Kubernetes self-healing**: `kubectl delete pod <backend-pod>` -
  Kubernetes should recreate it automatically; `/ready` failing is what
  keeps the new pod out of rotation until it's actually up.
- **GitOps drift**: hand-edit the live Deployment (e.g. `kubectl edit`) -
  ArgoCD should detect the drift and reconcile it back to what's in Git.

## 6. Testing

**Backend** (pytest):

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

Covers health/readiness, game start/end (including unknown-session and
invalid-score handling), leaderboard ordering, the demo endpoints
(including that `/api/test/error` never leaks a stack trace and
correctly increments `api_errors_total`), and that `/metrics` exposes
the expected metric names.

**Frontend** (vitest + Testing Library):

```bash
cd frontend
npm install
npm test
```

Covers: the game loads to a start screen, player movement (including
clamping at the play-area edges), score increasing over time, a
collision correctly ending the game and reporting the final score,
restarting returning to a clean playing state, and that the game stays
fully playable (and shows an "offline mode" indicator) when the
backend is unreachable.

## 7. Docker & security notes

- Both images are multi-stage and non-root (`appuser` in the backend
  image, the built-in `nginx` user in the frontend image).
- The frontend's runtime image contains only the static build output
  served by `nginx:alpine`; no Node.js, no source code, no `node_modules`
  ships in the final image.
- The backend's runtime image contains only the installed dependencies
  and the `app/` package; test files and dev dependencies
  (`requirements-dev.txt`) are excluded via `.dockerignore`.
- No secrets are baked into either image. `.env.example` documents the
  configurable values; a real `.env` is git-ignored.
- CORS is restricted via the `CORS_ORIGINS` environment variable rather
  than left wide open by default in a real deployment.
- A global exception handler guarantees unhandled backend errors return
  a generic `{"detail": "Internal server error"}` - never a stack trace
  or exception message - while the real error is logged server-side and
  counted in `api_errors_total`.
- Both images set `HEALTHCHECK` instructions aligned with `/health` and
  `/ready` / the served index page, matching what Kubernetes liveness
  and readiness probes will later check.
- Both Dockerfiles and the resulting images are intended to be scanned
  with **Trivy** by the platform project; nothing here special-cases or
  suppresses scan findings.

## 8. How this is intended to be deployed to Kubernetes

This repository produces two container images - `neon-runner-frontend`
and `neon-runner-backend` - and nothing more. It does **not** contain
Kubernetes manifests, Helm charts, an ArgoCD Application, or Prometheus/
Grafana configuration. Those belong to the separate infrastructure /
GitOps repository, which is expected to:

- Wrap each image in a `Deployment` + `Service` (with liveness/readiness
  probes pointed at `/health` and `/ready`), a `ConfigMap` for non-secret
  environment variables (`APP_ENV`, `LOG_LEVEL`, `CORS_ORIGINS`), a
  `Secret` for anything sensitive added later, and an `Ingress` routing
  the frontend and `/api` traffic appropriately.
- Scrape `/metrics` with Prometheus and build Grafana dashboards/alerts
  from the metric names listed above.
- Deploy via ArgoCD from a Git repository (this one, or a Helm chart
  that references these images), so that drift between the live cluster
  state and what's committed to Git is detected and reconciled
  automatically.
- Scan both images with Trivy as part of the pipeline.

```
        Developer
            │
            ▼
           Git
            │
            ▼
         ArgoCD
            │
            ▼
       Kubernetes
        │       │
        ▼       ▼
    Frontend  Backend
                │
       ┌────────┴────────┐
       ▼                 ▼
   Prometheus           Trivy
       │
       ▼
    Grafana
```

Neon Runner just needs to be small, predictable, and honest about its
health - the platform is the showcase.
