import os

from fastapi import FastAPI
from dotenv import load_dotenv
import uvicorn

from app.api.routes.extract import router as extract_router
from app.api.routes.generate import router as generate_router
from app.api.routes.transcript import router as transcript_router

app = FastAPI(
    title="ML Service",
    description="AI-powered document processing service",
    version="0.1.0"
)

load_dotenv()

@app.get("/health")
def health_check():
    hf_api = bool(os.getenv("HF_TOKEN"))
    return {"status": "ok", "hf_api": hf_api}

@app.get("/")
def root():
    return {"service": "ml_service", "status": "ok"}

app.include_router(extract_router)
app.include_router(transcript_router)
app.include_router(generate_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
