from fastapi import APIRouter, File, UploadFile

from app.pipelines.document_pipeline import process_pdf, process_ppt

router = APIRouter()

@router.post("/extract/pdf")
async def extract_pdf(file: UploadFile = File(...)):
	pdf_bytes = await file.read()
	return process_pdf(pdf_bytes)

@router.post("/extract/pptx")
async def extract_ppt(file: UploadFile = File(...)):
	pptx_bytes = await file.read()
	return process_ppt(pptx_bytes)
