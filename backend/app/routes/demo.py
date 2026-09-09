"""
Demo / testing endpoints.

These exist ONLY to demonstrate the observability platform (Prometheus
error-rate and latency graphs, Grafana alerts, troubleshooting drills).
They are not part of the game itself and are not called during normal
play. They intentionally misbehave in a fixed, predictable way - no
randomness - so a demo is reproducible.

Do not remove the "demo" tag or the docstrings below; they are what
makes it obvious to anyone reading the API docs (/docs) that these
routes are not real product functionality.
"""
import asyncio

from fastapi import APIRouter, HTTPException

from app.logging_config import get_logger
from app.metrics.metrics import game_errors_total

router = APIRouter(prefix="/api/test", tags=["demo"])
logger = get_logger("demo")


@router.get("/error")
async def demo_error():
    """Always returns HTTP 500. Used to demonstrate error-rate monitoring."""
    logger.warning("Demo error endpoint invoked - returning intentional HTTP 500")
    game_errors_total.labels(category="demo").inc()
    raise HTTPException(status_code=500, detail="Intentional demo error")


@router.get("/slow")
async def demo_slow(delay_seconds: float = 3.0):
    """
    Always delays before responding. Used to demonstrate latency
    monitoring. delay_seconds is clamped to a sane range so this can't
    be used to hold connections open indefinitely.
    """
    clamped_delay = max(0.0, min(delay_seconds, 10.0))
    logger.info("Demo slow endpoint invoked - delaying %.1fs", clamped_delay)
    await asyncio.sleep(clamped_delay)
    return {"status": "ok", "delayed_seconds": clamped_delay}
