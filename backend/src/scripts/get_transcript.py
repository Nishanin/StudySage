"""
YouTube Transcript Helper
Called from Node.js via child_process to fetch YouTube transcripts.
Usage: python get_transcript.py <videoId> [language]
Output: JSON to stdout
"""
import sys
import json

from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id, lang='en'):
    try:
        ytt_api = YouTubeTranscriptApi()

        # Try to fetch in the requested language first, then fallback to any available
        try:
            transcript = ytt_api.fetch(video_id, languages=[lang, 'en'])
        except Exception:
            # Fallback: get the first available transcript
            transcript_list = ytt_api.list(video_id)
            transcript = transcript_list.find_transcript(['en']).fetch()

        segments = []
        for entry in transcript:
            segments.append({
                'text': entry.text,
                'start': entry.start,
                'duration': entry.duration,
            })

        full_text = ' '.join(entry.text for entry in transcript)

        result = {
            'success': True,
            'transcript': segments,
            'fullText': full_text,
            'totalSegments': len(segments),
            'language': lang,
        }
        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        error_msg = str(e)
        result = {
            'success': False,
            'error': error_msg,
        }
        print(json.dumps(result))
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Usage: python get_transcript.py <videoId> [language]'}))
        sys.exit(1)

    video_id = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'
    get_transcript(video_id, language)
