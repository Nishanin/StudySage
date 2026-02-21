from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


from app.scripts.get_transcript import fetch_transcript
from app.extractors.youtubeExtractor import extract_youtube_transcript

router = APIRouter()


class TranscriptRequest(BaseModel):
    videoId: str
    lang: str | None = "en"




@router.post("/api/transcript")
async def get_transcript(payload: TranscriptRequest):
    # Try legacy fetch_transcript first
    try:
        result = fetch_transcript(payload.videoId, payload.lang or "en")
        if result.get("success"):
            return {
                "success": True,
                "source": "youtube-transcript-api",
                "video_url": f"https://www.youtube.com/watch?v={payload.videoId}",
                "segments": result.get("transcript", []),
            }
        # If legacy returns error, propagate error message
        error_msg = result.get("error") or "Unknown error from fetch_transcript"
    except Exception as exc:
        error_msg = str(exc)

    # Fallback to new async extractor
    try:
        fallback = await extract_youtube_transcript(f"https://www.youtube.com/watch?v={payload.videoId}")
        if fallback and fallback.get("segments"):
            return {
                "success": True,
                **fallback,
            }
        else:
            error_msg = "No transcript segments returned from fallback extractor"
    except HTTPException as exc:
        error_msg = str(exc.detail)
    except Exception as exc:
        error_msg = f"Transcript extraction failed: {str(exc)}"

    # If both fail, return error with success: false
    return {
        "success": False,
        "error": error_msg,
    }
