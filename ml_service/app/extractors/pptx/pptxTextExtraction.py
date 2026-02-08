from io import BytesIO
from pptx import Presentation

def extract_text_from_pptx_bytes(pptx_bytes: bytes):
	prs = Presentation(BytesIO(pptx_bytes))
	slides = []

	for slide_index, slide in enumerate(prs.slides, start=1):
		slide_text = []

		for shape in slide.shapes:
			if not getattr(shape, "has_text_frame", False):
				continue

			for paragraph in shape.text_frame.paragraphs:
				text = paragraph.text.strip()
				if text:
					slide_text.append(text)

		slides.append(
			{
				"slide_number": slide_index,
				"text": "\n".join(slide_text),
				"source": "ppt_text",
			}
		)

	return {
		"total_slides": len(prs.slides),
		"slides": slides,
	}