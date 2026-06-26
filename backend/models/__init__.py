from .user import UserCreate, UserLogin, UserResponse
from .course import CourseCreate, CourseResponse
from .lesson import LessonCreate, LessonResponse
from .resource import ResourceCreate, ResourceResponse
from .activity import ActivityCreate, ActivityResponse, QuizQuestion
from .submission import (
    AssignmentSubmission,
    QuizSubmission,
    SubmissionResponse,
    GradeRequest,
)

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "CourseCreate",
    "CourseResponse",
    "LessonCreate",
    "LessonResponse",
    "ResourceCreate",
    "ResourceResponse",
    "ActivityCreate",
    "ActivityResponse",
    "QuizQuestion",
    "AssignmentSubmission",
    "QuizSubmission",
    "SubmissionResponse",
    "GradeRequest",
]
