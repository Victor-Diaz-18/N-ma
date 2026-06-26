from pydantic import BaseModel, Field
from typing import Optional, Literal


class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    type: Literal["link", "file"]
    url: Optional[str] = None
    file_id: Optional[str] = None
    description: Optional[str] = ""


class ResourceResponse(BaseModel):
    id: str
    course_id: str
    title: str
    type: str
    url: Optional[str] = None
    file_id: Optional[str] = None
    description: Optional[str] = ""
    created_at: Optional[str] = None
