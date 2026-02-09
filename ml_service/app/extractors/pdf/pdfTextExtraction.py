import fitz
from utils.text_cleaning import clean_text

def extract_text_from_pdf_bytes(pdf_bytes: bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        pages = []

        for page_no in range(doc.page_count):
            page = doc.load_page(page_no)
            text = page.get_text("text")
            text = clean_text(text)
            pages.append(
                {
                    "page_number": page_no + 1,
                    "text": text,
                    "source": "pdf_text",
                }
            )

        return {
            "total_pages": doc.page_count,
            "pages": pages,
        }
    finally:
        doc.close()
