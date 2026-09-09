"""
Very small in-memory store for anonymous game statistics.

There is no database and no user accounts by design (see project brief).
Stats reset when the process restarts - that's fine, this backend exists
to give the Kubernetes platform a realistic workload to observe, not to
be a system of record.

A single lock keeps this safe under FastAPI's threaded execution of
sync code / concurrent async requests.
"""
import threading
import uuid
from dataclasses import dataclass, field


@dataclass
class GameStats:
    games_started: int = 0
    games_completed: int = 0
    highest_score: int = 0
    _completed_scores_sum: int = field(default=0, repr=False)

    @property
    def average_score(self) -> float:
        if self.games_completed == 0:
            return 0.0
        return round(self._completed_scores_sum / self.games_completed, 2)


class Store:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.stats = GameStats()
        self._active_sessions: set[str] = set()
        self._leaderboard: list[dict] = []  # [{"score": int}, ...] most recent first

    def start_game(self) -> str:
        session_id = uuid.uuid4().hex
        with self._lock:
            self.stats.games_started += 1
            self._active_sessions.add(session_id)
        return session_id

    def end_game(self, session_id: str, score: int) -> bool:
        """Returns False if the session_id is unknown (already ended / invalid)."""
        with self._lock:
            if session_id not in self._active_sessions:
                return False
            self._active_sessions.remove(session_id)
            self.stats.games_completed += 1
            self.stats._completed_scores_sum += score
            if score > self.stats.highest_score:
                self.stats.highest_score = score
            self._leaderboard.append({"score": score})
            self._leaderboard.sort(key=lambda entry: entry["score"], reverse=True)
            self._leaderboard = self._leaderboard[:10]
        return True

    def get_stats(self) -> dict:
        with self._lock:
            return {
                "games_started": self.stats.games_started,
                "games_completed": self.stats.games_completed,
                "highest_score": self.stats.highest_score,
                "average_score": self.stats.average_score,
            }

    def get_leaderboard(self) -> list[dict]:
        with self._lock:
            return [
                {"rank": i + 1, "score": entry["score"]}
                for i, entry in enumerate(self._leaderboard)
            ]


store = Store()
