from app.generators.embedding_model import embed_text
from app.validation.internet_chunks import chunk_text
from app.validation.web_search import search_web
from app.validation.trafilatura_extractor import extract_text_from_url


def get_internet_embeddings(claim: str):
  print("\n========== INTERNET PIPELINE START ==========")
  # print(f"Claim: {claim}")

  urls = search_web(claim)
  # print(f"URLs found: {len(urls)}")
  # for i, url in enumerate(urls):
  #   print(f"  {i + 1}. {url}")

  all_text = ""
  successful_urls = 0

  for url in urls:
    # print(f"\nFetching: {url}")
    text = extract_text_from_url(url["link"])

    if text:
      print(f"  ✓ Extracted length: {len(text)} characters")
      all_text += text + "\n"
      successful_urls += 1
    else:
      print("  ✗ Extraction failed or too short")

  # print(f"\nSuccessful URLs: {successful_urls}")
  # print(f"Total combined text length: {len(all_text)} characters")

  if not all_text.strip():
    print("⚠ No internet content extracted.")
    return {
      "chunks": [],
      "chunk_embeddings": []
    }

  chunks = chunk_text(all_text)
  print(f"Total chunks created: {len(chunks)}")

  # Safety cap
  chunks = chunks[:30]
  print(f"Chunks after cap: {len(chunks)}")

  # Step 4: Embed
  print("Embedding chunks...")
  chunk_embeddings = embed_text(chunks)

  print(f"Embeddings created: {len(chunk_embeddings)}")
  if chunk_embeddings:
    print(f"Embedding vector length: {len(chunk_embeddings[0])}")
    # print(f"Embeddings: {chunk_embeddings[0][:5]}")

  print("========== INTERNET PIPELINE END ==========\n")

  return {
    "chunks": chunks,
    "chunk_embeddings": chunk_embeddings
  }

get_internet_embeddings("Applications of CNN")