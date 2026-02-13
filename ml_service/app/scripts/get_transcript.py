"""
YouTube Transcript Helper
Used by FastAPI to fetch YouTube transcripts.
"""
from youtube_transcript_api import YouTubeTranscriptApi


def fetch_transcript(video_id: str, lang: str = "en") -> dict:
    if not video_id:
        return {"success": False, "error": "videoId is required"}

    try:
        ytt_api = YouTubeTranscriptApi()

        transcript_list = ytt_api.list(video_id)

        # Auto-detect language if requested
        if not lang or lang == "auto":
            available_langs = [t.language_code for t in transcript_list]
            if not available_langs:
                return {"success": False, "error": "No transcripts available"}
            lang = available_langs[0]

        # Try requested language first, then fallback to English, then any available
        try:
            transcript = transcript_list.find_transcript([lang]).fetch()
        except Exception:
            try:
                transcript = transcript_list.find_transcript(["en"]).fetch()
                lang = "en"
            except Exception:
                available_langs = [t.language_code for t in transcript_list]
                if not available_langs:
                    return {"success": False, "error": "No transcripts available"}
                lang = available_langs[0]
                transcript = transcript_list.find_transcript([lang]).fetch()

        segments = [
            {
                "text": entry.text,
                "start": entry.start,
                "duration": entry.duration,
            }
            for entry in transcript
        ]

        full_text = " ".join(entry.text for entry in transcript)

        return {
            "success": True,
            "transcript": segments,
            "fullText": full_text,
            "totalSegments": len(segments),
            "language": lang,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}
