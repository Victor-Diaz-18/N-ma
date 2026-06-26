from pydantic import BaseModel, Field
from typing import Optional, List


class AssignmentSubmission(BaseModel):
    activity_id: str
    file_id: Optional[str] = None
    text_response: Optional[str] = None


class QuizSubmission(BaseModel):
    activity_id: str
    answers: List[int] = Field(..., min_length=1)


class SubmissionResponse(BaseModel):
    id: str
    activity_id: str
    course_id: str
    student_id: str
    student_name: str
    type: str
    file_id: Optional[str] = None
    text_response: Optional[str] = None
    answers: Optional[List[int]] = None
    correct_count: Optional[int] = None
    total_count: Optional[int] = None
    percent: Optional[int] = None
    score: Optional[int] = None
    status: str
    feedback: Optional[str] = None
    xp_awarded: int = 0
    submitted_at: Optional[str] = None
    graded_at: Optional[str] = None


class GradeRequest(BaseModel):
    score: int = Field(..., ge=0)
    feedback: str = ""
