import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


@pytest.fixture()
def client():
    # Reset shared in-memory state between tests so they don't leak
    # counters into each other.
    store.stats.games_started = 0
    store.stats.games_completed = 0
    store.stats.highest_score = 0
    store.stats._completed_scores_sum = 0
    store._active_sessions.clear()
    store._leaderboard.clear()
    return TestClient(app)
