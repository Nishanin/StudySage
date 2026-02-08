from fastapi import FastAPI

app = FastAPI(
    title="ML Service",
    description="AI-powered document processing service",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok"}
