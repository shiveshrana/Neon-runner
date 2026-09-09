import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.config import settings
from app.logging_config import configure_logging, get_logger
from app.metrics.metrics import (
    api_errors_total,
    api_request_duration_seconds,
    api_requests_total,
)
from app.routes import demo, game, health, stats

configure_logging()
logger = get_logger("main")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Application startup (app_env=%s)", settings.app_env)
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="Neon Runner API",
    description=(
        "Minimal backend for the Neon Runner game. Exists to give a "
        "GitOps-driven Kubernetes platform (with observability and "
        "security guardrails) a realistic API workload to deploy, "
        "monitor, and scan - see /docs for the full route list."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """
    Times every request, records Prometheus metrics, logs a single
    summary line per request, and adds a couple of basic security
    headers on the way out.
    """
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        # Route may not have resolved if the exception happened early;
        # fall back to the raw path in that case (still low cardinality
        # in practice since unmatched paths are rare, deliberate probes).
        route = request.scope.get("route")
        endpoint = route.path if route else request.url.path
        api_requests_total.labels(method=request.method, endpoint=endpoint, status="500").inc()
        api_errors_total.labels(method=request.method, endpoint=endpoint, status="500").inc()
        logger.exception("Unhandled error on %s %s", request.method, endpoint)
        raise

    duration = time.perf_counter() - start

    # Group by route template (e.g. "/api/game/end") rather than raw path
    # so path parameters never become label values -> keeps cardinality low.
    route = request.scope.get("route")
    endpoint = route.path if route else request.url.path
    status = str(response.status_code)

    api_requests_total.labels(method=request.method, endpoint=endpoint, status=status).inc()
    api_request_duration_seconds.labels(method=request.method, endpoint=endpoint).observe(duration)

    if response.status_code >= 500:
        api_errors_total.labels(method=request.method, endpoint=endpoint, status=status).inc()
        logger.error(
            "%s %s -> %s (%.1fms)", request.method, endpoint, status, duration * 1000
        )
    else:
        logger.info(
            "%s %s -> %s (%.1fms)", request.method, endpoint, status, duration * 1000
        )

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Last-resort handler for anything that isn't an intentional
    HTTPException. Logs the real error server-side but never leaks
    internal details (stack traces, exception messages) to the client.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(health.router)
app.include_router(game.router)
app.include_router(stats.router)
app.include_router(demo.router)


@app.get("/metrics")
def metrics() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
