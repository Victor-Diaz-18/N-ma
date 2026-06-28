from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.auth_service import AuthService

router = APIRouter(prefix="/api", tags=["ai"])


class QuizGenerateRequest(BaseModel):
    course_id: str
    num_questions: int = Field(default=5, ge=1, le=20)


def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service


def get_ai_service(request: Request):
    return request.app.state.ai_service


@router.post("/ai/generate-quiz")
async def generate_quiz(
    data: QuizGenerateRequest,
    request: Request,
):
    auth = get_auth_service(request)
    user = await auth.require_role(request, "teacher")

    ai_service = get_ai_service(request)
    db = request.app.state.db

    course = await db.courses.find_one({"id": data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    if course.get("teacher_id") != user["id"]:
        raise HTTPException(status_code=403, detail="No eres el profesor de este curso")

    lessons = await db.lessons.find({"course_id": data.course_id}).to_list(100)

    try:
        questions = await ai_service.generate_quiz(
            course_title=course.get("title", ""),
            course_description=course.get("description", ""),
            lessons=[{"title": l.get("title", ""), "content": l.get("content", "")} for l in lessons],
            num_questions=data.num_questions,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar quiz: {str(e)}")

    return {"questions": questions}
