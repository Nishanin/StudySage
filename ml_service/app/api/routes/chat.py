from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

from app.generators.rag_generator import generate_rag_answer

class ChatGenerateRequest(BaseModel):
    system_prompt: str
    context_chunks: List[str]
    user_message: str
    chat_history: List[Dict[str, str]] = []

@router.post("/generate/chat")
def generate_chat(req: ChatGenerateRequest):
    answer = generate_rag_answer(
        system_prompt=req.system_prompt,
        context_chunks=req.context_chunks,
        user_message=req.user_message,
        chat_history=req.chat_history,
    )
    return {"answer": answer}
