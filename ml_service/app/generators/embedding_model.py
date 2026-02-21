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


def embed_text(text_or_texts) -> list[float] | list[list[float]]:
    """
    Generate normalized embeddings for input text(s).
    Accepts a single string or a list of strings.
    Output dimension: 384 per embedding.
    """
    if isinstance(text_or_texts, str):
        texts = [text_or_texts]
    elif isinstance(text_or_texts, list) and all(isinstance(t, str) for t in text_or_texts):
        texts = text_or_texts
    else:
        return []

    if not texts:
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
            result = arr.tolist()
            # Return single embedding if input was a string
            if isinstance(text_or_texts, str):
                return result[0]
            return result

        print("[Embedding] Unexpected shape:", arr.shape)
        return []

    except Exception as e:
        print(f"[Embedding Error] {e}")
        return []
