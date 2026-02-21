import asyncio
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.generators.embedding_model import embed_text
from app.generators.rag_generator import generate_rag_answer

from app.generators.notes_generator import generate_notes
from app.generators.flashcards_generator import generate_flashcards
from app.generators.quiz_generator import generate_quiz
from app.generators.faq_generator import generate_faqs
from fastapi import Body
from app.generators.mindmap_generator import generate_mindmap

router = APIRouter()
_MAX_TEXT_LENGTH = 8000
_GENERATION_TIMEOUT_SECONDS = 60

class FAQRequest(BaseModel):
    context_text: str
    count: int = Field(default=6, ge=1, le=20)

class FAQResponse(BaseModel):
    faqs: list[dict]


@router.post("/generate/faqs", response_model=FAQResponse)
async def generate_faqs_route(payload: FAQRequest = Body(...)):
    text = payload.context_text
    count = payload.count or 6
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="context_text is required and must not be empty.")
    if len(text) > _MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"context_text must be {_MAX_TEXT_LENGTH} characters or fewer.")
    start_time = time.time()
    start_perf = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        task = loop.run_in_executor(None, generate_faqs, text, count)
        result = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
        faqs = result["faqs"]
    except asyncio.TimeoutError:
        end_perf = time.perf_counter()
        end_time = time.time()
        # print(f"/generate/faqs start={start_time:.3f} end={end_time:.3f} elapsed={end_perf - start_perf:.3f}s status=timeout")
        return JSONResponse(
            status_code=504,
            content={"error": {"message": "FAQ generation timed out.", "type": "timeout"}}
        )
    except Exception as exc:
        end_perf = time.perf_counter()
        end_time = time.time()
        # print(f"/generate/faqs start={start_time:.3f} end={end_time:.3f} elapsed={end_perf - start_perf:.3f}s status=error")
        message = str(exc) or "FAQ generation failed."
        return JSONResponse(
            status_code=500,
            content={"error": {"message": message, "type": type(exc).__name__}}
        )
    end_perf = time.perf_counter()
    end_time = time.time()
    # print(f"/generate/faqs start={start_time:.3f} end={end_time:.3f} elapsed={end_perf - start_perf:.3f}s status=ok")
    return {"faqs": faqs}


class GenerateRequest(BaseModel):
    system_prompt: str
    context_chunks: list[str]
    user_message: str
    chat_history: list[dict] = Field(default_factory=list)

class GenerateResponse(BaseModel):
    answer: str

@router.post("/generate", response_model=GenerateResponse)
async def generate_rag_route(payload: GenerateRequest):
    if not isinstance(payload.user_message, str) or not payload.user_message.strip():
        raise HTTPException(status_code=400, detail="user_message must not be empty.")
    if len(payload.user_message) > 2000:
        raise HTTPException(status_code=400, detail="user_message must be 2000 characters or fewer.")
    total_context_len = sum(len(chunk) for chunk in payload.context_chunks)
    if total_context_len > 10000:
        raise HTTPException(status_code=400, detail="Total context_chunks size must be 10000 characters or fewer.")
    start_time = time.time()
    start_perf = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        task = loop.run_in_executor(
            None,
            generate_rag_answer,
            payload.system_prompt,
            payload.context_chunks,
            payload.user_message,
            payload.chat_history
        )
        answer = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=timeout"
        )
        return JSONResponse(
            status_code=504,
            content={
                "error": {
                    "message": "RAG generation timed out.",
                    "type": "timeout"
                }
            }
        )
    except Exception as exc:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=error"
        )
        message = str(exc) or "RAG generation failed."
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": message,
                    "type": type(exc).__name__
                }
            }
        )
    end_perf = time.perf_counter()
    end_time = time.time()
    print(
        f"/generate start={start_time:.3f} end={end_time:.3f} "
        f"elapsed={end_perf - start_perf:.3f}s status=ok"
    )
    return {"answer": answer}


# --- /embed endpoint models ---
class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    vector: list[float]


# --- /embed endpoint ---
@router.post("/embed", response_model=EmbedResponse)
async def embed_route(payload: EmbedRequest):
    text = payload.text
    if not isinstance(text, str) or not text.strip():
        raise HTTPException(status_code=400, detail="Text input is required and must not be empty.")
    vector = embed_text(text)
    if not vector:
        raise HTTPException(status_code=500, detail="Embedding failed or returned empty vector.")
    return {"vector": vector}

@router.post("/generate/notes")
async def generate_notes_route(payload: dict):
    text = payload.get("text") if isinstance(payload, dict) else None
    # Reject empty input early to avoid unnecessary model work.
    if text is None or not str(text).strip():
        raise HTTPException(status_code=400, detail="Text input is required.")
    # Cap input size to keep memory usage stable.
    if len(str(text)) > _MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Text input must be 8000 characters or fewer."
        )

    # Record basic timing for observability.
    start_time = time.time()
    start_perf = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        # Run generation in a worker thread and apply a hard timeout.
        task = loop.run_in_executor(None, generate_notes, str(text))
        notes = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/notes start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=timeout"
        )
        return JSONResponse(
            status_code=504,
            content={
                "error": {
                    "message": "Notes generation timed out.",
                    "type": "timeout"
                }
            }
        )
    except Exception as exc:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/notes start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=error"
        )
        message = str(exc) or "Notes generation failed."
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": message,
                    "type": type(exc).__name__
                }
            }
        )

    end_perf = time.perf_counter()
    end_time = time.time()
    print(
        f"/generate/notes start={start_time:.3f} end={end_time:.3f} "
        f"elapsed={end_perf - start_perf:.3f}s status=ok"
    )

    return {"notes": notes}

@router.post("/generate/flashcards")
async def generate_flashcards_route(payload: dict):
    text = payload.get("text") if isinstance(payload, dict) else None
    # Reject empty input early to avoid unnecessary model work.
    if text is None or not str(text).strip():
        raise HTTPException(status_code=400, detail="Text input is required.")
    # Cap input size to keep memory usage stable.
    if len(str(text)) > _MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Text input must be 8000 characters or fewer."
        )

    # Record basic timing for observability.
    start_time = time.time()
    start_perf = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        # Run generation in a worker thread and apply a hard timeout.
        task = loop.run_in_executor(None, generate_flashcards, str(text))
        flashcards = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/flashcards start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=timeout"
        )
        return JSONResponse(
            status_code=504,
            content={
                "error": {
                    "message": "Flashcards generation timed out.",
                    "type": "timeout"
                }
            }
        )
    except Exception as exc:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/flashcards start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=error"
        )
        message = str(exc) or "Flashcards generation failed."
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": message,
                    "type": type(exc).__name__
                }
            }
        )

    end_perf = time.perf_counter()
    end_time = time.time()
    print(
        f"/generate/flashcards start={start_time:.3f} end={end_time:.3f} "
        f"elapsed={end_perf - start_perf:.3f}s status=ok"
    )

    return flashcards

@router.post("/generate/quiz")
async def generate_quiz_route(payload: dict):
    text = payload.get("text") if isinstance(payload, dict) else None
    # Reject empty input early to avoid unnecessary model work.
    if text is None or not str(text).strip():
        raise HTTPException(status_code=400, detail="Text input is required.")
    # Cap input size to keep memory usage stable.
    if len(str(text)) > _MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Text input must be 8000 characters or fewer."
        )

    # Record basic timing for observability.
    start_time = time.time()
    start_perf = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        # Run generation in a worker thread and apply a hard timeout.
        task = loop.run_in_executor(None, generate_quiz, str(text))
        quiz = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/quiz start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=timeout"
        )
        return JSONResponse(
            status_code=504,
            content={
                "error": {
                    "message": "Quiz generation timed out.",
                    "type": "timeout"
                }
            }
        )
    except Exception as exc:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/quiz start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=error"
        )
        message = str(exc) or "Quiz generation failed."
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": message,
                    "type": type(exc).__name__
                }
            }
        )

    end_perf = time.perf_counter()
    end_time = time.time()
    print(
        f"/generate/quiz start={start_time:.3f} end={end_time:.3f} "
        f"elapsed={end_perf - start_perf:.3f}s status=ok"
    )

    return quiz

@router.post("/generate/mindmap")
async def generate_mindmap_route(payload: dict):
    text = payload.get("text") if isinstance(payload, dict) else None
    # Reject empty input early to avoid unnecessary model work.
    if text is None or not str(text).strip():
        raise HTTPException(status_code=400, detail="Text input is required.")
    # Cap input size to keep memory usage stable.
    if len(str(text)) > _MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="Text input must be 8000 characters or fewer."
        )

    # Record basic timing for observability.
    start_time = time.time()
    start_perf = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        # Run generation in a worker thread and apply a hard timeout.
        task = loop.run_in_executor(None, generate_mindmap, str(text))
        mindmap = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/mindmap start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=timeout"
        )
        return JSONResponse(
            status_code=504,
            content={
                "error": {
                    "message": "Mind map generation timed out.",
                    "type": "timeout"
                }
            }
        )
    except Exception as exc:
        end_perf = time.perf_counter()
        end_time = time.time()
        print(
            f"/generate/mindmap start={start_time:.3f} end={end_time:.3f} "
            f"elapsed={end_perf - start_perf:.3f}s status=error"
        )
        message = str(exc) or "Mind map generation failed."
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": message,
                    "type": type(exc).__name__
                }
            }
        )

    end_perf = time.perf_counter()
    end_time = time.time()
    print(
        f"/generate/mindmap start={start_time:.3f} end={end_time:.3f} "
        f"elapsed={end_perf - start_perf:.3f}s status=ok"
    )

    return mindmap
