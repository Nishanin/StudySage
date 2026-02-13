import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from json_repair import repair_json

_HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct:novita"
_MAX_NEW_TOKENS = 1400

load_dotenv()


def _extract_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found.")
    return text[start:end + 1]


def generate_quiz(text: str) -> dict:
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN missing in .env")

    client = InferenceClient(
        api_key=hf_token,
        base_url="https://router.huggingface.co"
    )

    system_prompt = (
        "You are a QUIZ GENERATOR.\n"
        "Return ONLY valid JSON. No markdown. No prose.\n\n"

        "QUIZ SCHEMA:\n"
        "{\n"
        '  "quiz": [\n'
        "    {\n"
        '      "id": 1,\n'
        '      "question": "What is DBMS?",\n'
        '      "options": [\n'
        '        "Database Management System",\n'
        '        "Digital Backup System",\n'
        '        "Data Binary Storage",\n'
        '        "None of the above"\n'
        "      ],\n"
        '      "answer": "Database Management System"\n'
        "    }\n"
        "  ]\n"
        "}\n\n"

        "GENERATION RULES:\n"
        "- Generate EXACTLY 10 questions.\n"
        "- IDs must be numbers 1–10.\n"
        "- Each question must have 4 FULL TEXT options.\n"
        "- OPTIONS MUST NOT BE A, B, C, D.\n"
        "- Answer must EXACTLY match one option string.\n"
        "- No empty strings.\n"
        "- No markdown.\n\n"

        "FINAL RULES:\n"
        "- Return EXACTLY one JSON object.\n"
        "- Never start second JSON.\n"
        "- Stop after closing brace if token limit reached.\n"
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
            top_p=0.85,
        )

    try:
        completion = _call_model()
    except Exception as exc:
        raise RuntimeError(f"HF inference request failed: {exc}") from exc

    # Retry Loop
    for _ in range(3):
        try:
            raw = completion.choices[0].message.content.strip()
            clean = _extract_json(raw)
            fixed = repair_json(clean)
            parsed = json.loads(fixed)

            if "quiz" not in parsed or not isinstance(parsed["quiz"], list):
                raise ValueError("Missing quiz key")

            quiz = parsed["quiz"]
            if len(quiz) != 10:
                raise ValueError("Must be exactly 10 questions")

            for i, item in enumerate(quiz, start=1):
                if item.get("id") != i:
                    raise ValueError("Invalid ID sequence")

                if not item.get("question"):
                    raise ValueError("Empty question")

                options = item.get("options")
                if not isinstance(options, list) or len(options) != 4:
                    raise ValueError("Options must be 4 items")

                # NEW VALIDATION — NO ABCD ONLY
                for opt in options:
                    if opt.strip().upper() in ["A", "B", "C", "D"]:
                        raise ValueError("Options cannot be single letters")

                answer = item.get("answer")
                if not answer or answer not in options:
                    raise ValueError("Answer mismatch")

            return parsed

        except Exception:
            completion = _call_model(temp=0.15)

    raise RuntimeError("Model failed to produce valid JSON after retries.")
