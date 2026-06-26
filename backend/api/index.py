import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/test-config")
def test_config():
    try:
        from config import get_settings
        settings = get_settings()
        return {"mongo_url": "set", "db_name": settings.db_name, "jwt_secret": "set" if settings.jwt_secret else "missing"}
    except Exception as e:
        import traceback
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})

@app.get("/api/test-motor")
def test_motor():
    try:
        from config import get_settings
        from motor.motor_asyncio import AsyncIOMotorClient
        settings = get_settings()
        client = AsyncIOMotorClient(settings.mongo_url)
        return {"status": "client created"}
    except Exception as e:
        import traceback
        return JSONResponse(status_code=500, content={"error": str(e), "trace": traceback.format_exc()})
