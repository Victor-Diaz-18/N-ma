import sys
import os

# Add parent directory to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI

test_app = FastAPI()

@test_app.get("/")
def root():
    return {"status": "ok", "msg": "Vercel Python works"}

@test_app.get("/api/health")
def health():
    return {"status": "ok"}

handler = test_app
