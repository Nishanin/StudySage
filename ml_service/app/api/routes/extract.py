from fastapi import APIRouter, File, UploadFile

from pipelines.document_pipeline import process_pdf

router = APIRouter()

@router.post("/extract/pdf")
async def extract_pdf(file: UploadFile = File(...)):
	pdf_bytes = await file.read()
	return process_pdf(pdf_bytes)
