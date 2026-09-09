"""
Health and readiness endpoints.

These are intentionally trivial and dependency-free:

- /health (liveness): the process is up and able to respond at all.
  Kubernetes uses this to decide whether to restart the container.
- /ready (readiness): the API is ready to serve traffic.
  Kubernetes uses this to decide whether to send traffic to the pod.

This backend has no external dependencies (no database, no cache), so
both checks are simple process-level checks today. If a real dependency
is added later, /ready is the place to check it - not /health, since a
slow dependency should take the pod out of the load-balancing pool
without triggering a restart loop.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {"status": "healthy"}


@router.get("/ready")
def ready() -> dict:
    return {"status": "ready"}
