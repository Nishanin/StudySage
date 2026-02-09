import re

def clean_text(value: str) -> str:
    """Normalize whitespace and collapse multiple newlines to one."""
    if not value:
        return ""

    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[\t ]+", " ", normalized)
    normalized = re.sub(r"\n{2,}", "\n", normalized)
    normalized = re.sub(r" *\n *", "\n", normalized)
    return normalized.strip()
