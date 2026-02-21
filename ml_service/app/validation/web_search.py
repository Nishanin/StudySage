import os
import requests

def search_web(query: str) -> list:
    url = "https://google.serper.dev/search"

    payload = {"q": query, "num": 3}
    api_key = os.getenv("SERPER_API_KEY", "").strip()
    if not api_key:
        return []
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        response.raise_for_status()
        data = response.json()

        results = []

        for item in data.get("organic", [])[:3]:
            results.append({
                "title": item.get("title"),
                "link": item.get("link")
            })

        return results

    except requests.exceptions.RequestException as e:
        print("Error:", e)
        return []
