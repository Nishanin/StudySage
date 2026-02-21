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


def embed_text(texts: list[str]) -> list[list[float]]:
    """
    Generate normalized embeddings for a list of texts.
    Output dimension per embedding: 384
    """
    if not isinstance(texts, list) or not texts:
        return []

    try:
        model = _get_model()

        embeddings = model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=16,
            show_progress_bar=True
        )

        arr = np.asarray(embeddings, dtype=np.float32)

        if arr.ndim == 2 and arr.shape[1] == _EMBED_DIM:
            return arr.tolist()

        print("[Embedding] Unexpected shape:", arr.shape)
        return []

    except Exception as e:
        print(f"[Embedding Error] {e}")
        return []