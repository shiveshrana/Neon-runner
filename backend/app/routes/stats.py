from fastapi import APIRouter

from app.models.schemas import LeaderboardResponse, StatsResponse
from app.store import store

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
def get_stats() -> StatsResponse:
    return StatsResponse(**store.get_stats())


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard() -> LeaderboardResponse:
    return LeaderboardResponse(entries=store.get_leaderboard())
