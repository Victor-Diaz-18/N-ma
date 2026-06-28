from pydantic import BaseModel, Field
from typing import Optional, Literal, List


class QuizQuestion(BaseModel):
    question: str = Field(..., min_length=1)
    options: List[str] = Field(..., min_length=2)
    correct_index: int = Field(..., ge=0)


class ActivityCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    type: Literal["assignment", "quiz"]
    due_date: Optional[str] = None
    max_points: int = Field(default=100, ge=1)
    xp_reward: int = Field(default=50, ge=0)
    quiz_questions: Optional[List[QuizQuestion]] = None
    status: Literal["draft", "published"] = "published"


class ActivityResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    type: str
    due_date: Optional[str] = None
    max_points: int
    xp_reward: int
    quiz_questions: Optional[List[dict]] = None
    my_submission: Optional[dict] = None
    created_at: Optional[str] = None
