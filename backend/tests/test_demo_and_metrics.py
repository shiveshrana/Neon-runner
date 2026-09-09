def test_demo_error_returns_500(client):
    response = client.get("/api/test/error")
    assert response.status_code == 500
    # The demo error is an intentional HTTPException, not a leaked
    # internal stack trace - the client should only ever see a short
    # "detail" message.
    assert "Traceback" not in response.text
    assert response.json() == {"detail": "Intentional demo error"}


def test_demo_error_increments_api_errors_metric(client):
    client.get("/api/test/error")
    metrics_text = client.get("/metrics").text
    assert 'api_errors_total{endpoint="/api/test/error"' in metrics_text


def test_demo_slow_delays_and_clamps(client):
    response = client.get("/api/test/slow", params={"delay_seconds": 0.01})
    assert response.status_code == 200
    assert response.json()["delayed_seconds"] == 0.01


def test_metrics_endpoint_exposes_prometheus_format(client):
    # Generate some traffic so counters are non-empty.
    client.get("/health")
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "api_requests_total" in response.text
    assert "api_errors_total" in response.text
    assert "game_sessions_total" in response.text
