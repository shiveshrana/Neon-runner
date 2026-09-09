# syntax=docker/dockerfile:1

FROM python:3.12-slim AS base

# Keep Python from writing .pyc files / buffering stdout - nicer for
# container logs, and slightly smaller image.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first so this layer is cached unless requirements
# actually change.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create a dedicated non-root user to run the application as.
RUN useradd --create-home --shell /usr/sbin/nologin appuser

COPY app ./app

USER appuser

EXPOSE 8000

# /ready is a good default healthcheck target: it reflects whether the
# API can actually serve traffic, which is what we care about here.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=2)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
