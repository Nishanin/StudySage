from .pdfTextExtraction import extract_text_from_pdf_bytes

def extract_pdf_content(pdf_bytes: bytes):
	return extract_text_from_pdf_bytes(pdf_bytes)
