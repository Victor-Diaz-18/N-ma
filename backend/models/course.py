from pydantic import BaseModel, Field
from typing import Optional


class CourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1, max_length=100)
    cover_color: str = "#FFE156"


class CourseResponse(BaseModel):
    id: str
    title: str
    description: str
    subject: str
    cover_color: str
    teacher_id: str
    teacher_name: str
    student_count: int = 0
    is_enrolled: bool = False
    is_owner: bool = False
    created_at: Optional[str] = None
