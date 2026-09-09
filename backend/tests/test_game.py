def test_start_game_returns_session_id(client):
    response = client.post("/api/game/start")
    assert response.status_code == 200
    body = response.json()
    assert "session_id" in body
    assert len(body["session_id"]) > 0


def test_end_game_updates_stats(client):
    session_id = client.post("/api/game/start").json()["session_id"]

    end_response = client.post(
        "/api/game/end", json={"session_id": session_id, "score": 1500}
    )
    assert end_response.status_code == 200
    assert end_response.json() == {"accepted": True}

    stats = client.get("/api/stats").json()
    assert stats["games_started"] == 1
    assert stats["games_completed"] == 1
    assert stats["highest_score"] == 1500
    assert stats["average_score"] == 1500


def test_end_game_unknown_session_returns_404(client):
    response = client.post(
        "/api/game/end", json={"session_id": "not-a-real-session", "score": 100}
    )
    assert response.status_code == 404


def test_end_game_rejects_invalid_score(client):
    session_id = client.post("/api/game/start").json()["session_id"]
    response = client.post(
        "/api/game/end", json={"session_id": session_id, "score": -5}
    )
    assert response.status_code == 422


def test_leaderboard_orders_scores_descending(client):
    for score in [300, 900, 600]:
        session_id = client.post("/api/game/start").json()["session_id"]
        client.post("/api/game/end", json={"session_id": session_id, "score": score})

    entries = client.get("/api/leaderboard").json()["entries"]
    scores = [entry["score"] for entry in entries]
    assert scores == [900, 600, 300]
