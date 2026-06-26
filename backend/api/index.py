import sys
import os
import traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/debug")
def debug():
    steps = {}
    try:
        from config import get_settings
        settings = get_settings()
        steps["config"] = "ok"
    except Exception as e:
        steps["config"] = str(e)

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        steps["motor"] = "ok"
    except Exception as e:
        steps["motor"] = str(e)

    try:
        from services.auth_service import AuthService
        steps["auth_service"] = "ok"
    except Exception as e:
        steps["auth_service"] = str(e)

    try:
        from services.gamification_service import GamificationService
        steps["gamification_service"] = "ok"
    except Exception as e:
        steps["gamification_service"] = str(e)

    try:
        from services.file_service import FileService
        steps["file_service"] = "ok"
    except Exception as e:
        steps["file_service"] = str(e)

    try:
        from services.course_service import CourseService
        steps["course_service"] = "ok"
    except Exception as e:
        steps["course_service"] = str(e)

    try:
        from middleware.error_handler import setup_error_handlers
        steps["error_handler"] = "ok"
    except Exception as e:
        steps["error_handler"] = str(e)

    try:
        from middleware.rate_limiter import setup_rate_limiter
        steps["rate_limiter"] = "ok"
    except Exception as e:
        steps["rate_limiter"] = str(e)

    try:
        from routes.auth_routes import router as auth_router
        steps["auth_routes"] = "ok"
    except Exception as e:
        steps["auth_routes"] = str(e)

    try:
        from routes.course_routes import router as course_router
        steps["course_routes"] = "ok"
    except Exception as e:
        steps["course_routes"] = str(e)

    try:
        from routes.activity_routes import router as activity_router
        steps["activity_routes"] = "ok"
    except Exception as e:
        steps["activity_routes"] = str(e)

    try:
        from routes.gamification_routes import router as gamification_router
        steps["gamification_routes"] = "ok"
    except Exception as e:
        steps["gamification_routes"] = str(e)

    try:
        from routes.file_routes import router as file_router
        steps["file_routes"] = "ok"
    except Exception as e:
        steps["file_routes"] = str(e)

    return steps
