"""
Prometheus metrics for Neon Runner's backend.

Kept intentionally small and low-cardinality: no per-user or per-session
labels, since those would grow the metric's cardinality unbounded. Labels
here are limited to a small, fixed set of values (route, method, status
class), which keeps memory use predictable and keeps Grafana dashboards
readable.
"""
from prometheus_client import Counter, Histogram

game_sessions_total = Counter(
    "game_sessions_total",
    "Total number of game sessions started",
)

game_sessions_completed_total = Counter(
    "game_sessions_completed_total",
    "Total number of game sessions completed (ended with a game over)",
)

game_errors_total = Counter(
    "game_errors_total",
    "Total number of application errors, by category",
    ["category"],
)

api_requests_total = Counter(
    "api_requests_total",
    "Total number of API requests received",
    ["method", "endpoint", "status"],
)

api_request_duration_seconds = Histogram(
    "api_request_duration_seconds",
    "API request duration in seconds",
    ["method", "endpoint"],
)

api_errors_total = Counter(
    "api_errors_total",
    "Total number of API requests that resulted in a server error (5xx)",
    ["method", "endpoint", "status"],
)
