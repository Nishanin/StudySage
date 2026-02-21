import os
import requests

def search_web(query: str) -> list:
    url = "https://google.serper.dev/search"

    payload = {"q": query, "num": 3}
    headers = {
        "X-API-KEY": "4ebe6de4f01d47e34971608a9db90900a776a19b" ,# || os.getenv("SERPER_API_KEY"),
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
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
