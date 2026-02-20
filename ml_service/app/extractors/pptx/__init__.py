from .pptxTextExtraction import extract_text_from_pptx_bytes

def extract_ppt_content(pptx_bytes: bytes):
	return extract_text_from_pptx_bytes(pptx_bytes)
