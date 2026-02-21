from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.validation.matching.internal_similarity import compute_internal_coverage

router = APIRouter()


class InternalCoverageRequest(BaseModel):
    source_text: str
    generated_notes: str
    threshold: float = 0.65


@router.post("/internal-coverage")
def internal_coverage(payload: InternalCoverageRequest):
    source_text = (payload.source_text or "").strip()
    generated_notes = (payload.generated_notes or "").strip()

    if not source_text or not generated_notes:
        raise HTTPException(
            status_code=400,
            detail="source_text and generated_notes must not be empty",
        )

    try:
        return compute_internal_coverage(
            source_text=source_text,
            generated_notes=generated_notes,
            threshold=payload.threshold,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
