import os
import json
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from json_repair import repair_json


_HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct:novita"
_MAX_NEW_TOKENS = 1200

load_dotenv()


def _extract_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found.")
    return text[start : end + 1]


def generate_mindmap(text: str) -> dict:
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        raise RuntimeError("HF_TOKEN missing in .env")

    client = InferenceClient(
        api_key=hf_token, base_url="https://router.huggingface.co"
    )

    system_prompt = (
        "You are a mind map generator.\n"
        "Output ONLY valid JSON following the schema exactly.\n"
        "No markdown. No explanations. No prose outside JSON.\n"
        "If JSON invalid → regenerate internally.\n\n"

        "SCHEMA:\n"
        "{\n"
        '  "mindmap": {\n'
        '    "root": "Main Topic",\n'
        '    "nodes": [\n'
        '      { "id": "n1", "label": "Subtopic", "parent": "root" }\n'
        "    ]\n"
        "  }\n"
        "}\n\n"

        "RULES:\n"
        '- "root" is a short string describing the main topic (2–4 words max).\n'
        '- Each node has "id", "label", "parent".\n'
        "- ids must be unique: n1, n2, n3, etc.\n"
        '- "parent" is either "root" or another node id.\n'
        "- Maximum depth: 3 levels below root.\n"
        "- Maximum children per node: 5.\n"
        "- Generate between 10 and 15 nodes total.\n"
        "- Nodes must cover key subtopics from the text.\n"
        "- Labels must be short (2–5 words).\n"
        "- No duplicate labels.\n"
        '- Avoid repeating generic labels like "Advantages", "Disadvantages", "Examples" more than once.\n'
        "- No hallucination.\n\n"

        "CRITICAL OUTPUT RULES:\n"
        "- RETURN ONLY RAW JSON.\n"
        "- DO NOT USE MARKDOWN.\n"
        "- DO NOT WRAP IN ``` OR ```json.\n"
        "- RETURN EXACTLY ONE JSON OBJECT.\n"
        "- NEVER START A SECOND JSON OBJECT.\n"
        "- IF TOKEN LIMIT IS REACHED, STOP AFTER CLOSING JSON.\n"

    )

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

            # Validate structure
            if not isinstance(parsed.get("mindmap"), dict):
                raise ValueError("Missing mindmap object")
            mm = parsed["mindmap"]
            if not isinstance(mm.get("root"), str) or not mm["root"].strip():
                raise ValueError("Missing or empty root")
            if not isinstance(mm.get("nodes"), list) or len(mm["nodes"]) < 1:
                raise ValueError("Missing or empty nodes array")
            for node in mm["nodes"]:
                if not all(k in node for k in ("id", "label", "parent")):
                    raise ValueError(f"Node missing required keys: {node}")

            return parsed

        except (json.JSONDecodeError, AttributeError, IndexError, TypeError, ValueError):
            # Retry once with stricter sampling
            completion = _call_model()

    raise RuntimeError("Model failed to produce valid mind map JSON after retries.")
