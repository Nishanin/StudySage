from extractors.pdf import extract_pdf_content
from extractors.pptx import extract_ppt_content


def process_pdf(pdf_bytes: bytes):
	extracted = extract_pdf_content(pdf_bytes)
	return {
		"type": "pdf",
		"total_pages": extracted["total_pages"],
		"pages": extracted["pages"],
	}

def process_ppt(pptx_bytes: bytes):
	extracted = extract_ppt_content(pptx_bytes)
	return {
		"type": "ppt",
		"total_slides": extracted["total_slides"],
		"slides": extracted["slides"],
	}
