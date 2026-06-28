from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.auth_service import AuthService

router = APIRouter(prefix="/api", tags=["ai"])


class ActivityGenerateRequest(BaseModel):
    course_id: str
    activity_type: Literal["quiz", "exam", "assignment"] = "quiz"
    num_questions: int = Field(default=5, ge=1, le=20)


class ChatRequest(BaseModel):
    course_id: str
    question: str = Field(..., min_length=1, max_length=1000)


def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service


def get_ai_service(request: Request):
    return request.app.state.ai_service


@router.post("/ai/generate-activity")
async def generate_activity(
    data: ActivityGenerateRequest,
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
        result = await ai_service.generate_activity(
            course_title=course.get("title", ""),
            course_description=course.get("description", ""),
            lessons=[{"title": l.get("title", ""), "content": l.get("content", "")} for l in lessons],
            activity_type=data.activity_type,
            num_questions=data.num_questions,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
            raise HTTPException(status_code=429, detail="Límite de solicitudes de IA alcanzado. Intenta de nuevo en unos minutos.")
        raise HTTPException(status_code=500, detail="Error al generar actividad con IA. Intenta de nuevo.")

    return result


@router.post("/ai/chat")
async def chat(
    data: ChatRequest,
    request: Request,
):
    auth = get_auth_service(request)
    user = await auth.get_current_user(request)

    ai_service = get_ai_service(request)
    db = request.app.state.db

    course = await db.courses.find_one({"id": data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    enrolled = await db.enrollments.find_one({"course_id": data.course_id, "user_id": user["id"]})
    is_teacher = course.get("teacher_id") == user["id"]
    is_student_enrolled = user["role"] == "student" and enrolled is not None

    if not is_teacher and not is_student_enrolled:
        raise HTTPException(status_code=403, detail="No estás inscrito en este curso")

    lessons = await db.lessons.find({"course_id": data.course_id}).to_list(100)

    try:
        answer = await ai_service.chat(
            course_title=course.get("title", ""),
            course_description=course.get("description", ""),
            lessons=[{"title": l.get("title", ""), "content": l.get("content", "")} for l in lessons],
            question=data.question,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
            raise HTTPException(status_code=429, detail="Límite de solicitudes de IA alcanzado. Intenta de nuevo en unos minutos.")
        raise HTTPException(status_code=500, detail="Error al procesar tu pregunta. Intenta de nuevo.")

    return {"answer": answer}
