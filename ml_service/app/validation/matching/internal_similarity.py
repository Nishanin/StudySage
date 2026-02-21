from app.generators.embedding_model import embed_text

import numpy as np
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity

def chunk_text(text: str, size: int = 400, overlap: int = 50) -> List[str]:
    """
    Split text into chunks with overlap, matching Node chunking.
    """
    if not text or not isinstance(text, str):
        return []
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i+size]
        if len(chunk) >= 5:
            chunks.append(' '.join(chunk))
        if len(chunk) < size:
            break
        i += size - overlap
    return chunks

def embed_chunks(chunks: List[str]) -> np.ndarray:
    """
    Embed chunks in batch mode using embed_text.
    """
    embeddings = embed_text(chunks)
    if embeddings is None or len(embeddings) == 0:
        return np.array([], dtype=np.float32)
    return np.asarray(embeddings, dtype=np.float32)

def compute_internal_coverage(source_text: str, generated_notes: str, threshold: float = 0.65) -> Dict:
    """
    Compute coverage score between source and notes using cosine similarity.
    """
    source_chunks = chunk_text(source_text)
    notes_chunks = chunk_text(generated_notes)
    if not source_chunks or not notes_chunks:
        return {
            "coverage_score": 0.0,
            "covered_chunks": 0,
            "total_source_chunks": len(source_chunks),
            "max_similarity_per_source_chunk": [],
        }
    source_vecs = embed_chunks(source_chunks)
    notes_vecs = embed_chunks(notes_chunks)
    if source_vecs.size == 0 or notes_vecs.size == 0:
        return {
            "coverage_score": 0.0,
            "covered_chunks": 0,
            "total_source_chunks": len(source_chunks),
            "max_similarity_per_source_chunk": [],
        }
    sim_matrix = cosine_similarity(source_vecs, notes_vecs)
    max_sim = sim_matrix.max(axis=1)
    covered = np.sum(max_sim >= threshold)
    coverage_score = float(covered) / float(len(source_vecs)) if len(source_vecs) else 0.0
    return {
        "coverage_score": coverage_score,
        "covered_chunks": int(covered),
        "total_source_chunks": len(source_vecs),
        "max_similarity_per_source_chunk": max_sim.tolist(),
    }


def compute_internal_faithfulness(
    source_text: str,
    generated_notes: str,
    threshold: float = 0.65,
    faithfulness_threshold: float = 0.56,
) -> Dict:
    """
    Compute faithfulness score by checking whether note sentences are supported
    by at least one source chunk using cosine similarity.
    """
    import re

    source_chunks = chunk_text(source_text)
    raw_sentences = re.split(r"[.!?]", generated_notes or "")
    note_sentences = []
    for sentence in raw_sentences:
        cleaned = sentence.strip()
        if not cleaned:
            continue
        if len(cleaned.split()) >= 5:
            note_sentences.append(cleaned)

    if not source_chunks or not note_sentences:
        return {
            "faithfulness_score": 0.0,
            "supported_note_chunks": 0,
            "total_note_chunks": len(note_sentences),
            "max_similarity_per_note_chunk": [],
        }

    source_vecs = embed_chunks(source_chunks)
    notes_vecs = embed_chunks(note_sentences)
    if source_vecs.size == 0 or notes_vecs.size == 0:
        return {
            "faithfulness_score": 0.0,
            "supported_note_chunks": 0,
            "total_note_chunks": len(note_sentences),
            "max_similarity_per_note_chunk": [],
        }

    sim_matrix = cosine_similarity(notes_vecs, source_vecs)
    max_sim = sim_matrix.max(axis=1)
    max_similarities = max_sim.tolist()

    supported = np.sum(max_sim >= faithfulness_threshold)
    faithfulness_score = (
        float(supported) / float(len(notes_vecs)) if len(notes_vecs) else 0.0
    )

    return {
        "faithfulness_score": faithfulness_score,
        "supported_note_chunks": int(supported),
        "total_note_chunks": len(notes_vecs),
        "max_similarity_per_note_chunk": max_similarities,
    }


def compute_internal_grounding(
    source_text: str,
    generated_notes: str,
    threshold: float = 0.65,
    coverage_weight: float = 0.5,
    faithfulness_weight: float = 0.5,
) -> Dict:
    coverage = compute_internal_coverage(
        source_text=source_text,
        generated_notes=generated_notes,
        threshold=threshold,
    )
    faithfulness = compute_internal_faithfulness(
        source_text=source_text,
        generated_notes=generated_notes,
        threshold=threshold,
        faithfulness_threshold=0.56,
    )

    coverage_score = float(coverage.get("coverage_score", 0.0) or 0.0)
    faithfulness_score = float(faithfulness.get("faithfulness_score", 0.0) or 0.0)

    weight_sum = float(coverage_weight) + float(faithfulness_weight)
    if weight_sum != 1.0:
        if weight_sum == 0.0:
            coverage_weight = 0.5
            faithfulness_weight = 0.5
        else:
            coverage_weight = float(coverage_weight) / weight_sum
            faithfulness_weight = float(faithfulness_weight) / weight_sum

    has_valid_coverage = bool(coverage) and "coverage_score" in coverage
    has_valid_faithfulness = bool(faithfulness) and "faithfulness_score" in faithfulness

    if not has_valid_coverage or not has_valid_faithfulness:
        grounding_score = 0.0
    else:
        grounding_score = (
            float(coverage_weight) * coverage_score
            + float(faithfulness_weight) * faithfulness_score
        )

    return {
        "coverage_score": coverage_score,
        "faithfulness_score": faithfulness_score,
        "grounding_score": grounding_score,
        "details": {
            "coverage": coverage,
            "faithfulness": faithfulness,
        },
    }


def _debug_test_internal_grounding():

    source_text = """
    Binary search runs in O(log n) time complexity.
    Merge sort uses divide and conquer.
    Operating systems manage memory and processes.
    Databases use indexing for efficient retrieval.
    Machine learning models learn patterns from data.
    """

    # 1️⃣ Good Summary (partial but correct, no hallucination)
    notes_good_partial = """
    Binary search has logarithmic time complexity O(log n).
    Merge sort follows divide and conquer paradigm.
    Operating systems manage memory.
    """

    # 2️⃣ Hallucinated Notes (contains incorrect unsupported claim)
    notes_hallucinated = """
    Binary search works on unsorted arrays.
    Merge sort follows divide and conquer.
    """

    # 3️⃣ Garbage Notes (unrelated content)
    notes_garbage = """
    The Roman Empire expanded across Europe.
    Photosynthesis occurs in chloroplasts.
    """

    print("\n===== GOOD PARTIAL SUMMARY =====")
    result_good = compute_internal_grounding(source_text, notes_good_partial)
    print(result_good)

    print("\n===== HALLUCINATED NOTES =====")
    result_hallucinated = compute_internal_grounding(source_text, notes_hallucinated)
    print(result_hallucinated)

    print("\n===== GARBAGE NOTES =====")
    result_garbage = compute_internal_grounding(source_text, notes_garbage)
    print(result_garbage)

    return {
        "good": result_good,
        "hallucinated": result_hallucinated,
        "garbage": result_garbage
    }
