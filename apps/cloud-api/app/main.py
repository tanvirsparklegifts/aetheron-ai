from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AETHERON Cloud API",
    version="0.1.0",
    description="Early API foundation for the AETHERON intelligence platform.",
    docs_url="/docs",
    redoc_url=None,
)

# Configure exact production origins before deployment. Do not use wildcard origins
# with credentialed requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)


@app.get("/health", tags=["operations"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "aetheron-cloud-api", "version": "0.1.0"}


@app.get("/api/v1", tags=["meta"])
async def api_root() -> dict[str, str]:
    return {
        "name": "AETHERON",
        "status": "foundation",
        "message": "Cloud intelligence and authenticated workflows are not connected yet.",
    }
