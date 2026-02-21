import trafilatura


def extract_text_from_url(url: str) -> str:
  downloaded = trafilatura.fetch_url(url)

  if not downloaded:
    return ""

  text = trafilatura.extract(
    downloaded,
    include_comments=False,
    include_tables=False,
    target_language="en"
  )

  return text if text else ""
