import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/test-import")
def test_import():
    try:
        from config import get_settings
        settings = get_settings()
        return {"mongo_url": settings.mongo_url[:20] + "...", "db_name": settings.db_name}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
