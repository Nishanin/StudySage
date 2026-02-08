from fastapi import FastAPI
import uvicorn

from api.routes.extract import router as extract_router

app = FastAPI(
    title="ML Service",
    description="AI-powered document processing service",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(extract_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
