def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> list:
  words = text.split()
  chunks = []
  start = 0

  while start < len(words):
    end = start + chunk_size
    chunk = " ".join(words[start:end])
    chunks.append(chunk)
    start += chunk_size - overlap

  return chunks