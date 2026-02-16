import asyncio
import time

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.generators.notes_generator import generate_notes
from app.generators.flashcards_generator import generate_flashcards
from app.generators.quiz_generator import generate_quiz
from app.generators.mindmap_generator import generate_mindmap

router = APIRouter()
_MAX_TEXT_LENGTH = 8000
_GENERATION_TIMEOUT_SECONDS = 60

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
