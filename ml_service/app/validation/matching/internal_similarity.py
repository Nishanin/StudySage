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
        chunks.append(' '.join(chunk))
        if len(chunk) < size:
            break
        i += size - overlap
    return chunks

def embed_chunks(chunks: List[str]) -> List[np.ndarray]:
    """
    Embed each chunk using embed_text. Returns list of np.ndarray.
    """
    vectors = []
    for chunk in chunks:
        vec = embed_text(chunk)
        if vec and isinstance(vec, list) and len(vec) == 384:
            vectors.append(np.asarray(vec, dtype=np.float32))
    return vectors

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
    if not source_vecs or not notes_vecs:
        return {
            "coverage_score": 0.0,
            "covered_chunks": 0,
            "total_source_chunks": len(source_chunks),
            "max_similarity_per_source_chunk": [],
        }
    sim_matrix = cosine_similarity(np.stack(source_vecs), np.stack(notes_vecs))
    max_sim = sim_matrix.max(axis=1)
    covered = np.sum(max_sim >= threshold)
    coverage_score = float(covered) / float(len(source_vecs)) if source_vecs else 0.0
    return {
        "coverage_score": coverage_score,
        "covered_chunks": int(covered),
        "total_source_chunks": len(source_vecs),
        "max_similarity_per_source_chunk": max_sim.tolist(),
    }
