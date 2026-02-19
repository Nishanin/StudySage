from sentence_transformers import SentenceTransformer
import numpy as np

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_EMBED_DIM = 384

_model = None

def _get_model():
    global _model
    if _model is None:
        print("[Embedding] Loading model...")
        _model = SentenceTransformer(_MODEL_NAME)
        print("[Embedding] Model loaded.")
    return _model


def embed_text(text: str) -> list[float]:
    """
    Generate a normalized embedding for the input text.
    Output dimension: 384
    """
    if not isinstance(text, str) or not text.strip():
        return []

    try:
        model = _get_model()
        emb = model.encode(text, normalize_embeddings=True)
        arr = np.asarray(emb, dtype=np.float32)

        if arr.ndim == 1 and arr.shape[0] == _EMBED_DIM:
            return arr.tolist()

        print("[Embedding] Unexpected shape:", arr.shape)
        return []

    except Exception as e:
        print(f"[Embedding Error] {e}")
        return []
