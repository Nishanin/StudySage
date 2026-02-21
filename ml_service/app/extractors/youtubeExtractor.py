import os
from typing import List, Dict, Any
from fastapi import HTTPException
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import httpx


def _parse_youtube_transcript(transcript: List[dict]) -> List[Dict[str, Any]]:
    return [
        {
            "text": entry["text"],
            "start": float(entry["start"]),
            "duration": float(entry["duration"]),
        }
        for entry in transcript
    ]


def _extract_video_id(video_url: str) -> str:
    import re
    patterns = [
        r"youtu\.be/([\w-]{11})",
        r"youtube\.com/watch\?v=([\w-]{11})",
        r"youtube\.com/embed/([\w-]{11})",
        r"youtube\.com/v/([\w-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, video_url)
        if match:
            return match.group(1)
    raise HTTPException(status_code=400, detail="Invalid YouTube URL")


async def _fetch_external_transcript(video_url: str) -> List[Dict[str, Any]]:
    api_key = os.getenv("TRANSCRIPT_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="TRANSCRIPT_API_KEY not set in environment")
    url = f"https://transcriptapi.com/api/v2/youtube/transcript?video_url={video_url}"
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"External API error: {resp.text}")
        data = resp.json()

        segments = []
        if "segments" in data:
            segments = data["segments"]
        elif "transcript" in data:
            segments = data["transcript"]
        else:
            raise HTTPException(status_code=500, detail="External API returned unexpected format")
        
        normalized = []
        for entry in segments:
            normalized.append({
                "text": entry.get("text", ""),
                "start": float(entry.get("start", 0)),
                "duration": float(entry.get("duration", 0)),
            })
        return normalized


async def extract_youtube_transcript(video_url: str) -> dict:
    video_id = _extract_video_id(video_url)
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        segments = _parse_youtube_transcript(transcript)
        if not segments:
            raise NoTranscriptFound(video_id)
        return {
            "source": "youtube-transcript-api",
            "video_url": video_url,
            "segments": segments,
        }
    except Exception:
        # Any error, fallback to external API
        try:
            segments = await _fetch_external_transcript(video_url)
            if not segments:
                raise HTTPException(status_code=404, detail="Transcript not found via external API")
            return {
                "source": "external-api",
                "video_url": video_url,
                "segments": segments,
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Transcript extraction failed: {str(exc)}")
