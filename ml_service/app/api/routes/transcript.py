from fastapi import APIRouter
from pydantic import BaseModel

from app.scripts.get_transcript import fetch_transcript

router = APIRouter()


class TranscriptRequest(BaseModel):
    videoId: str
    lang: str | None = "en"


@router.post("/api/transcript")
async def get_transcript(payload: TranscriptRequest):
    return fetch_transcript(payload.videoId, payload.lang or "en")
