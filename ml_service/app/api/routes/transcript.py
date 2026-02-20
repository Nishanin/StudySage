from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.scripts.get_transcript import fetch_transcript

router = APIRouter()


class TranscriptRequest(BaseModel):
    videoId: str
    lang: str | None = "en"


@router.post("/api/transcript")
async def get_transcript(payload: TranscriptRequest):
    try:
        from app.scripts.get_transcript import fetch_transcript
    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="youtube_transcript_api is not installed",
        ) from exc

    return fetch_transcript(payload.videoId, payload.lang or "en")
