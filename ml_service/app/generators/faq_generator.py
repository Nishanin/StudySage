import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from json_repair import repair_json

_HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct:novita"
_MAX_NEW_TOKENS = 400

def generate_faqs(context_text: str, count: int = 6) -> dict:
    load_dotenv()
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN missing in .env")

    client = InferenceClient(
        api_key=hf_token,
        base_url="https://router.huggingface.co"
    )

    system_prompt = (
        "You are a strict JSON generator.\n"
        "Return ONLY valid JSON.\n"
        "Use double quotes.\n"
        "No markdown.\n"
        "No explanations.\n"
        "No extra text.\n"
    )

    user_prompt = f"""
STUDY MATERIAL:
{context_text}

TASK:
Generate exactly {count} FAQs.

Rules:
- Use ONLY the study material.
- Each FAQ must contain:
    "question": string
    "answer": string (2-4 sentences)
- No empty strings.
- Output format:

{{
  "faqs": [
    {{"question": "...", "answer": "..."}}
  ]
}}
"""

    completion = client.chat.completions.create(
        model=_HF_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=300,
        temperature=0.2,
        top_p=0.8,
    )

    raw = completion.choices[0].message.content.strip()
    print("[FAQ_GENERATOR] Raw:", raw)

    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise RuntimeError("No JSON found in model output")

    clean = raw[start:end + 1]
    fixed = repair_json(clean)
    parsed = json.loads(fixed)

    return parsed