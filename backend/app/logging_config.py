"""
Centralized logging configuration.

Kept deliberately simple: one consistent line format, level driven by
the LOG_LEVEL environment variable (see app.config), output to stdout
so it's picked up by `docker logs` / `kubectl logs` without any extra
wiring. Nothing here writes passwords, secrets, tokens, or other
sensitive values - log call sites are responsible for staying within
that rule (session ids and scores are fine; there is no user data to
leak).
"""
import logging
import sys

from app.config import settings

_LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s %(message)s"


def configure_logging() -> None:
    logging.basicConfig(
        level=settings.log_level,
        format=_LOG_FORMAT,
        stream=sys.stdout,
        force=True,  # safe to reconfigure if this ever runs twice (e.g. tests)
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"neon_runner.{name}")
