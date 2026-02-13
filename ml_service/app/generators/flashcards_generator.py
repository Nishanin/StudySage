import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from json_repair import repair_json

_HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2:together"
_MAX_NEW_TOKENS = 1024

load_dotenv()


def _extract_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found.")
    return text[start:end + 1]


def generate_flashcards(text: str) -> dict:
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN missing in .env")

    client = InferenceClient(
        api_key=hf_token,
        base_url="https://router.huggingface.co"
    )

    system_prompt = (
        "You are a flashcard generator.\n"
        "Output ONLY valid JSON following the schema exactly.\n"
        "No markdown. No explanations. No prose outside JSON.\n\n"

        "FLASHCARD SCHEMA:\n"
        "{\n"
        '  "flashcards": [\n'
        '    {\n'
        '      "id": 1,\n'
        '      "front": "question",\n'
        '      "back": "answer"\n'
        '    }\n'
        '  ]\n'
        "}\n\n"

        "GENERATION RULES:\n"
        "- Generate EXACTLY 5 flashcards.\n"
        "- IDs must be numbers 1,2,3,4,5 in order.\n"
        "- front is the question (non-empty).\n"
        "- back is the answer (non-empty).\n"
        "- No empty strings.\n"
        "- No markdown.\n\n"

        "CRITICAL OUTPUT RULES:\n"
        "- RETURN ONLY RAW JSON.\n"
        "- DO NOT USE MARKDOWN.\n"
        "- NEVER START A SECOND JSON OBJECT.\n"
    )

    def _call_model(temp=0.2):
        return client.chat.completions.create(
            model=_HF_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            max_tokens=_MAX_NEW_TOKENS,
            temperature=temp,
            top_p=0.8,
        )

    try:
        completion = _call_model()
    except Exception as exc:
        raise RuntimeError(f"HF inference request failed: {exc}") from exc

    # JSON validation + retry
    for attempt in range(2):
        try:
            raw = completion.choices[0].message.content.strip()
            clean = _extract_json(raw)
            fixed = repair_json(clean)
            parsed = json.loads(fixed)

            if "flashcards" not in parsed or not isinstance(parsed["flashcards"], list):
                raise ValueError("Missing flashcards key")

            flashcards = parsed["flashcards"]
            if len(flashcards) != 5:
                raise ValueError("Must be exactly 5 flashcards")

            for i, card in enumerate(flashcards, start=1):
                if not isinstance(card, dict):
                    raise ValueError("Flashcard is not object")

                if card.get("id") != i:
                    raise ValueError(f"Invalid id {card.get('id')} expected {i}")

                if not card.get("front") or not card.get("back"):
                    raise ValueError("Empty front/back")

            return parsed

        except Exception:
            # Retry once with lower temperature
            completion = _call_model(temp=0.15)

    raise RuntimeError("Model failed to produce valid JSON after retries.")
