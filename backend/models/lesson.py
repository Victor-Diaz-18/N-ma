from pydantic import BaseModel, Field
from typing import Optional


class LessonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    order: int = 0


class LessonResponse(BaseModel):
    id: str
    course_id: str
    title: str
    content: str
    order: int
    created_at: Optional[str] = None
