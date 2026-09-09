from fastapi import APIRouter, HTTPException

from app.logging_config import get_logger
from app.metrics.metrics import game_sessions_completed_total, game_sessions_total
from app.models.schemas import GameEndRequest, GameEndResponse, GameStartResponse
from app.store import store

router = APIRouter(prefix="/api/game", tags=["game"])
logger = get_logger("game")


@router.post("/start", response_model=GameStartResponse)
def start_game() -> GameStartResponse:
    session_id = store.start_game()
    game_sessions_total.inc()
    logger.info("Game started (session_id=%s)", session_id)
    return GameStartResponse(session_id=session_id)


@router.post("/end", response_model=GameEndResponse)
def end_game(payload: GameEndRequest) -> GameEndResponse:
    accepted = store.end_game(payload.session_id, payload.score)
    if not accepted:
        logger.warning("Game end rejected: unknown session_id=%s", payload.session_id)
        raise HTTPException(
            status_code=404,
            detail="Unknown or already-ended session_id",
        )
    game_sessions_completed_total.inc()
    logger.info(
        "Game completed (session_id=%s, score=%s)", payload.session_id, payload.score
    )
    return GameEndResponse(accepted=True)
