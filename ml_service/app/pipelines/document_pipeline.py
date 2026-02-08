from extractors.pdf import extract_pdf_content

def process_pdf(pdf_bytes: bytes):
	extracted = extract_pdf_content(pdf_bytes)
	return {
		"type": "pdf",
		"total_pages": extracted["total_pages"],
		"pages": extracted["pages"],
	}
