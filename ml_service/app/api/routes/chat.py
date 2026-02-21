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
    examMode: bool = False
    notesOnly: bool = False
    

@router.post("/generate/chat")
def generate_chat(req: ChatGenerateRequest):
    retrieved_results = [(chunk, 1.0) for chunk in req.context_chunks]
    answer = generate_rag_answer(
        system_prompt=req.system_prompt,
        retrieved_results=retrieved_results,
        user_message=req.user_message,
        chat_history=req.chat_history,
        examMode=req.examMode,
        notesOnly=req.notesOnly,
    )
    return {"answer": answer}
