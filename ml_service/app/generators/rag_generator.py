import os
from typing import List, Dict, Tuple
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

SIMILARITY_THRESHOLD = 0.45
MAX_TOKENS = 160

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2:together"

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN missing in environment.")

client = InferenceClient(
    api_key=HF_TOKEN,
    base_url="https://router.huggingface.co"
)


def _is_academic_query(query: str) -> bool:
    query = query.strip().lower()

    small_talk = {
        "hi", "hello", "hey",
        "thanks", "ok",
        "good morning", "good evening"
    }

    if query in small_talk:
        return False

    if len(query.split()) < 3:
        return False

    return True


def build_rag_prompt(
    context_chunks: List[str],
    user_message: str,
    chat_history: List[Dict[str, str]],
    examMode: bool = False,
    notesOnly: bool = False
) -> str:

    context_block = "\n\n".join(context_chunks) if context_chunks else ""

    history_block = ""
    for msg in (chat_history or [])[-5:]:
        if "role" in msg and "content" in msg:
            history_block += f"{msg['role']}: {msg['content']}\n"

    extra_instructions = ""

    if examMode:
        extra_instructions += """
- Limit answer to 4–6 sentences.
- No introduction.
- No conclusion.
- No meta commentary.
"""

    if notesOnly:
        extra_instructions += "- Use ONLY information from notes.\n"

    prompt = f"""
CONTEXT:
{context_block}

CHAT HISTORY:
{history_block}

USER QUESTION:
{user_message}

FINAL INSTRUCTIONS:
- Answer directly.
- Do NOT mention the context or source.
- Do NOT explain reasoning.
- Keep answer between 80–150 words.
- No introduction or conclusion.
- If information is missing, reply exactly:
The material does not contain that information.
{extra_instructions}

ANSWER:
"""

    return prompt.strip()


def generate_rag_answer(
    system_prompt: str,
    retrieved_results: List[Tuple[str, float]],  # (chunk, score)
    user_message: str,
    chat_history: List[Dict[str, str]],
    examMode: bool = False,
    notesOnly: bool = False
) -> str:

    if not _is_academic_query(user_message):
        return "Hello! How can I help you with your studies?"

    filtered_chunks = [
        chunk for chunk, score in retrieved_results
        if score >= SIMILARITY_THRESHOLD
    ]

    if not filtered_chunks:
        return "The material does not contain that information."

    prompt = build_rag_prompt(
        context_chunks=filtered_chunks,
        user_message=user_message,
        chat_history=chat_history,
        examMode=examMode,
        notesOnly=notesOnly
    )

    try:
        completion = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            max_tokens=MAX_TOKENS,
            temperature=0.2,
            top_p=0.9,
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

    except Exception as e:
        print(f"[RAG ERROR] {e}")

    return "The material does not contain that information."