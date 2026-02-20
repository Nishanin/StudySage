import os
from typing import List, Dict
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2:together"

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN missing in environment.")


def build_rag_prompt(
    context_chunks: List[str],
    user_message: str,
    chat_history: List[Dict[str, str]]
) -> str:
    context_block = "\n\n".join(context_chunks) if context_chunks else ""
    history_block = ""
    for msg in (chat_history or [])[-5:]:
        if "role" in msg and "content" in msg:
            history_block += f"{msg['role']}: {msg['content']}\n"
    prompt = f"""CONTEXT:
{context_block}

CHAT HISTORY:
{history_block}USER QUESTION:
{user_message}

FINAL INSTRUCTIONS:
- Answer ONLY using the provided CONTEXT.
- If the answer is not in the material, say:
  "The material does not contain that information."
- Do not hallucinate.
- Be concise and academic.
"""
    return prompt.strip()


def generate_rag_answer(
    system_prompt: str,
    context_chunks: List[str],
    user_message: str,
    chat_history: List[Dict[str, str]]
) -> str:
    prompt = build_rag_prompt(
        context_chunks,
        user_message,
        chat_history
    )
    try:
        completion = InferenceClient(
            api_key=HF_TOKEN,
            base_url="https://router.huggingface.co"
        ).chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.2,
            top_p=0.8,
        )
        answer = (
            completion and
            hasattr(completion, "choices") and
            completion.choices and
            hasattr(completion.choices[0], "message") and
            hasattr(completion.choices[0].message, "content") and
            completion.choices[0].message.content
        )
        if answer:
            return answer.strip()
    except Exception:
        pass
    return "The material does not contain that information."
