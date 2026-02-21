import requests

def extract_text_from_url(url: str) -> str:
    """
    Robust extraction with fallback and headers.
    """

    try:
        try:
            import trafilatura
        except Exception:
            return ""

        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; StudySageBot/1.0)"
        }

        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return ""

        downloaded = response.text
        text = trafilatura.extract(downloaded, target_language="en")

        if not text or len(text.split()) < 100:
            return ""

        return text

    except Exception:
        return ""
