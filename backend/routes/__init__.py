from .auth_routes import router as auth_router
from .course_routes import router as course_router
from .activity_routes import router as activity_router
from .gamification_routes import router as gamification_router
from .file_routes import router as file_router

__all__ = [
    "auth_router",
    "course_router",
    "activity_router",
    "gamification_router",
    "file_router",
]
