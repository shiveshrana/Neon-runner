from pydantic import BaseModel, Field


class GameStartResponse(BaseModel):
    session_id: str


class GameEndRequest(BaseModel):
    session_id: str
    score: int = Field(ge=0, le=10_000_000, description="Final score for the session")


class GameEndResponse(BaseModel):
    accepted: bool


class StatsResponse(BaseModel):
    games_started: int
    games_completed: int
    highest_score: int
    average_score: float


class LeaderboardEntry(BaseModel):
    rank: int
    score: int


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
