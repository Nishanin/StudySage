import re


def extract_claims_from_notes(notes_content) -> list[str]:
    claims: list[str] = []
    seen: set[str] = set()

    if isinstance(notes_content, dict):
        docs = [notes_content]
    elif isinstance(notes_content, list):
        docs = list(notes_content)
    else:
        return claims

    def _add_text_sentences(text: str) -> None:
        if not isinstance(text, str):
            return
        cleaned = text.strip()
        if not cleaned:
            return
        # Split into sentence-like segments while staying lightweight.
        parts = re.split(r"(?<=[.!?])\s+|\n+", cleaned)
        for part in parts:
            sentence = part.strip()
            if len(sentence) < 10:
                continue
            if sentence in seen:
                continue
            seen.add(sentence)
            claims.append(sentence)

    for doc in docs:
        if not isinstance(doc, dict):
            continue
        sections = doc.get("sections", [])
        if not isinstance(sections, list):
            continue
        for section in sections:
            if not isinstance(section, dict):
                continue
            blocks = section.get("blocks", [])
            if not isinstance(blocks, list):
                continue
            for block in blocks:
                if not isinstance(block, dict):
                    continue
                block_type = block.get("type")

                if block_type == "paragraph":
                    _add_text_sentences(block.get("content", ""))

                elif block_type == "definition":
                    term = block.get("term", "")
                    definition = block.get("definition", "")
                    term_text = term.strip() if isinstance(term, str) else ""
                    def_text = definition.strip() if isinstance(definition, str) else ""
                    if term_text and def_text:
                        _add_text_sentences(f"{term_text}: {def_text}")
                    elif term_text:
                        _add_text_sentences(term_text)
                    elif def_text:
                        _add_text_sentences(def_text)

                elif block_type == "list":
                    items = block.get("items", [])
                    if not isinstance(items, list):
                        continue
                    for item in items:
                        if isinstance(item, dict):
                            _add_text_sentences(item.get("content", ""))
                        elif isinstance(item, str):
                            _add_text_sentences(item)

    return claims


def select_high_risk_claims(claims: list[str], max_claims: int = 8) -> list[str]:
    """
    Select only high-risk factual claims for internet validation.

    Criteria:
    - Contains numbers
    - Contains complexity notation (O(, Θ(, Ω()
    - Contains strong qualifiers (always, never, only, must)
    - Contains requirement verbs (require, works on, operates on)
    - Contains "time complexity" or "space complexity"
    """
    if not claims:
        return []

    risk_keywords = [
        "always",
        "never",
        "only",
        "must",
        "require",
        "requires",
        "works on",
        "operates on",
        "time complexity",
        "space complexity",
        "O(",
        "Θ(",
        "Ω(",
    ]

    selected: list[str] = []

    for claim in claims:
        if not isinstance(claim, str):
            continue
        lower = claim.lower()

        has_number = any(char.isdigit() for char in claim)
        has_keyword = any(keyword.lower() in lower for keyword in risk_keywords)

        if has_number or has_keyword:
            selected.append(claim)

        if len(selected) >= max_claims:
            break

    return selected
