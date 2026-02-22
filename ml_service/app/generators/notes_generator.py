import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from json_repair import repair_json


_HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2:together"
_MAX_NEW_TOKENS = 1200

load_dotenv()

def _extract_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found.")
    return text[start:end + 1]

def generate_notes(text: str, regeneration_instruction: str | None = None) -> dict:
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN missing in .env")

    client = InferenceClient(api_key=hf_token, base_url="https://router.huggingface.co")

    system_prompt = (
        "You are a semantic academic document compiler.\n"
        "Output ONLY valid JSON following the schema exactly.\n"
        "No markdown. No explanations. No prose outside JSON.\n"
        "If JSON invalid → regenerate internally.\n\n"

        "DOCUMENT SCHEMA:\n"
        "{\n"
        '  "doc_id": null,\n'
        '  "language": "en",\n'
        '  "sections": [\n'
        '    {\n'
        '      "id": null,\n'
        '      "title": "string",\n'
        '      "blocks": []\n'
        '    }\n'
        '  ]\n'
        "}\n\n"

        "ALLOWED BLOCK TYPES: paragraph, definition, list, code, math.\n"
        "Each major topic becomes a section.\n"
        "Preserve definitions exactly.\n"
        "No hallucination.\n"
        "Do not use empty arrays or empty strings.\n"
        "null allowed only for doc_id and section.id.\n\n"

        "CRITICAL OUTPUT RULES:\n"
        "- RETURN ONLY RAW JSON.\n"
        "- DO NOT USE MARKDOWN.\n"
        "- DO NOT WRAP IN ``` OR ```json.\n"
        "- doc_id MUST BE null.\n"
        "- section.id MUST BE null.\n"
        "- USE ONLY ALLOWED BLOCK TYPES.\n"
        "- IF OUTPUT IS NOT VALID JSON, REGENERATE.\n\n"

        "FINAL RULES:\n"
        "- RETURN EXACTLY ONE JSON OBJECT.\n"
        "- NEVER START A SECOND JSON OBJECT.\n"
        "- IF TOKEN LIMIT IS REACHED, STOP AFTER CLOSING JSON.\n"
        "- Use LIST block for advantages, features, problems.\n"
        "- Use DEFINITION only for term–definition pairs.\n"
        "- Split major topics into separate sections.\n"
    )
    if regeneration_instruction is not None:
        system_prompt = system_prompt + "\n\n" + regeneration_instruction

    def _call_model():
        return client.chat.completions.create(
            model=_HF_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            max_tokens=_MAX_NEW_TOKENS,
            temperature=0.2,
            top_p=0.8,
        )

    # First attempt
    try:
        completion = _call_model()
    except Exception as exc:
        raise RuntimeError(f"HF inference request failed: {exc}") from exc

    # JSON validation + retry loop
    for _ in range(2):
        try:
            raw = completion.choices[0].message.content.strip()
            clean = _extract_json(raw)
            fixed = repair_json(clean)
            parsed = json.loads(fixed)
            return parsed

        except (json.JSONDecodeError, AttributeError, IndexError, TypeError):
            # Retry once with stricter sampling
            completion = _call_model()

    raise RuntimeError("Model failed to produce valid JSON after retries.")
