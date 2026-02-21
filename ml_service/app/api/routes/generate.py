import asyncio   
import time
from functools import partial
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
from app.validation.matching.internal_similarity import compute_internal_grounding
from app.validation.claim_extractor import (
    extract_claims_from_notes,
    select_high_risk_claims
)
from app.pipelines.internet_pipeline import compute_external_validation_score

router = APIRouter()
_MAX_TEXT_LENGTH = 8000
_GENERATION_TIMEOUT_SECONDS = 60
_NOTES_GROUNDING_THRESHOLD = 0.53
_NOTES_MAX_ATTEMPTS = 2
_EXTERNAL_VALIDATION_TIMEOUT_SECONDS = 8


def _stringify_notes(notes_content):
    """
    Convert normalized notes_content (List[dict]) into clean plain text
    for grounding comparison.
    """
    if not notes_content:
        return ""

    text_parts = []

    # Ensure we always iterate a list
    if isinstance(notes_content, dict):
        notes_content = [notes_content]

    for doc in notes_content:
        if not isinstance(doc, dict):
            continue
        sections = doc.get("sections", [])
        if not isinstance(sections, list):
            continue
        for section in sections:
            if not isinstance(section, dict):
                continue
            title = section.get("title")
            if title:
                text_parts.append(str(title))

            blocks = section.get("blocks", [])
            if not isinstance(blocks, list):
                continue
            for block in blocks:
                if not isinstance(block, dict):
                    continue
                block_type = block.get("type")

                if block_type == "paragraph":
                    content = block.get("content")
                    if content:
                        text_parts.append(str(content))

                elif block_type == "definition":
                    term = block.get("term", "")
                    definition = block.get("definition", "")
                    if term or definition:
                        text_parts.append(f"{term}: {definition}")

                elif block_type == "list":
                    items = block.get("items", [])
                    if not isinstance(items, list):
                        continue
                    for item in items:
                        if not isinstance(item, dict):
                            continue
                        item_content = item.get("content")
                        if item_content:
                            text_parts.append(str(item_content))

    return "\n".join(text_parts).strip()

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
    vectors = embed_text([text])
    vector = vectors[0] if isinstance(vectors, list) and vectors else []
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
        source_text = str(text)
        best_notes = None
        best_score = 0.0
        best_grounding_result = None
        best_notes_content = []
        final_attempts = _NOTES_MAX_ATTEMPTS

        for attempt in range(_NOTES_MAX_ATTEMPTS):
            if attempt == 0:
                task = loop.run_in_executor(None, generate_notes, source_text)
            else:
                task = loop.run_in_executor(
                    None,
                    partial(
                        generate_notes,
                        source_text,
                        regeneration_instruction=(
                            "Ensure all claims are strictly supported by the provided material. "
                            "Avoid adding external information. Improve coverage of missing topics."
                        ),
                    ),
                )
            notes_dict = await asyncio.wait_for(task, timeout=_GENERATION_TIMEOUT_SECONDS)
            if isinstance(notes_dict, dict):
                if "notes" in notes_dict and isinstance(notes_dict["notes"], list):
                    notes_content = notes_dict["notes"]
                else:
                    # assume single document dict
                    notes_content = [notes_dict]
            elif isinstance(notes_dict, list):
                notes_content = notes_dict
            else:
                # fallback safety
                notes_content = []
            notes_text = _stringify_notes(notes_content)
            grounding_result = compute_internal_grounding(source_text, notes_text)
            grounding_score = float(grounding_result.get("grounding_score", 0.0))

            if grounding_score >= _NOTES_GROUNDING_THRESHOLD:
                best_notes = notes_dict
                best_score = grounding_score
                best_grounding_result = grounding_result
                best_notes_content = notes_content
                final_attempts = attempt + 1
                break

            if best_notes is None or grounding_score > best_score:
                best_score = grounding_score
                best_notes = notes_dict
                best_grounding_result = grounding_result
                best_notes_content = notes_content
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

    claims = extract_claims_from_notes(best_notes_content)
    risky_claims = select_high_risk_claims(claims)
    try:
        loop = asyncio.get_running_loop()
        external_task = loop.run_in_executor(
            None,
            partial(compute_external_validation_score, risky_claims),
        )
        external_result = await asyncio.wait_for(
            external_task,
            timeout=_EXTERNAL_VALIDATION_TIMEOUT_SECONDS,
        )
    except Exception:
        external_result = {
            "external_score": 1.0,
            "supported": 0,
            "partially_supported": 0,
            "unsupported": 0,
            "total_claims": 0,
            "details": [],
        }
    external_score = external_result["external_score"]
    internal_score = (
        float(best_grounding_result["grounding_score"])
        if isinstance(best_grounding_result, dict) and "grounding_score" in best_grounding_result
        else 0.0
    )
    final_confidence = (
        0.6 * internal_score +
        0.4 * external_score
    )
    percentage = round(final_confidence * 100)
    if percentage >= 75:
        confidence_level = "High"
    elif percentage >= 60:
        confidence_level = "Medium"
    else:
        confidence_level = "Low"
    status = "accepted" if final_confidence >= 0.6 else "accepted_with_low_confidence"

    response_payload = {
        "notes": best_notes,
        "validation": {
            "validation_percentage": percentage,
            "confidence_level": confidence_level,
            "internal_score": internal_score,
            "external_score": external_result["external_score"]
        },
        "status": status
    }

    return response_payload

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
