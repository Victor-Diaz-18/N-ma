import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.activity import ActivityCreate
from models.submission import AssignmentSubmission, QuizSubmission, GradeRequest
from services.auth_service import AuthService
from services.gamification_service import GamificationService

router = APIRouter(prefix="/api", tags=["activities"])


def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service


def get_gamification_service(request: Request) -> GamificationService:
    return request.app.state.gamification_service


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/courses/{course_id}/activities")
async def create_activity(
    course_id: str,
    data: ActivityCreate,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.require_role(request, "teacher")
    db = get_db(request)

    course = await db.courses.find_one({"id": course_id})
    if not course or course["teacher_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your course")

    payload = data.model_dump()
    if payload["type"] == "quiz" and not payload.get("quiz_questions"):
        raise HTTPException(status_code=400, detail="Quiz requires questions")

    doc = {"id": str(uuid.uuid4()), "course_id": course_id, **payload, "created_at": now_iso()}
    await db.activities.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/courses/{course_id}/activities")
async def list_activities(
    course_id: str,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.get_current_user(request)
    db = get_db(request)

    activities = await db.activities.find({"course_id": course_id}, {"_id": 0}).to_list(200)

    if user["role"] == "student":
        for a in activities:
            sub = await db.submissions.find_one(
                {"activity_id": a["id"], "student_id": user["id"]}, {"_id": 0}
            )
            a["my_submission"] = sub
            if a.get("quiz_questions"):
                a["quiz_questions"] = [
                    {"question": q["question"], "options": q["options"]}
                    for q in a["quiz_questions"]
                ]
    return activities


@router.get("/activities/{activity_id}")
async def get_activity(
    activity_id: str,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.get_current_user(request)
    db = get_db(request)

    a = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Not found")

    if user["role"] == "student":
        sub = await db.submissions.find_one(
            {"activity_id": activity_id, "student_id": user["id"]}, {"_id": 0}
        )
        a["my_submission"] = sub
        if a.get("quiz_questions"):
            if not sub:
                a["quiz_questions"] = [
                    {"question": q["question"], "options": q["options"]}
                    for q in a["quiz_questions"]
                ]
    return a


@router.delete("/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.require_role(request, "teacher")
    db = get_db(request)

    a = await db.activities.find_one({"id": activity_id})
    if not a:
        raise HTTPException(status_code=404, detail="Not found")

    course = await db.courses.find_one({"id": a["course_id"]})
    if course["teacher_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.activities.delete_one({"id": activity_id})
    return {"ok": True}


@router.post("/activities/{activity_id}/submit-assignment")
async def submit_assignment(
    activity_id: str,
    data: AssignmentSubmission,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    gamification: GamificationService = Depends(get_gamification_service),
):
    user = await auth.require_role(request, "student")
    db = get_db(request)

    activity = await db.activities.find_one({"id": activity_id})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity["type"] != "assignment":
        raise HTTPException(status_code=400, detail="Activity is not an assignment")

    enr = await db.enrollments.find_one({"student_id": user["id"], "course_id": activity["course_id"]})
    if not enr:
        raise HTTPException(status_code=403, detail="Not enrolled in course")

    existing = await db.submissions.find_one({"activity_id": activity_id, "student_id": user["id"]})
    sub_id = existing["id"] if existing else str(uuid.uuid4())

    doc = {
        "id": sub_id,
        "activity_id": activity_id,
        "course_id": activity["course_id"],
        "student_id": user["id"],
        "student_name": user["name"],
        "type": "assignment",
        "file_id": data.file_id,
        "text_response": data.text_response,
        "status": "submitted",
        "score": None,
        "feedback": None,
        "graded_at": None,
        "submitted_at": now_iso(),
    }

    if existing:
        await db.submissions.update_one({"id": sub_id}, {"$set": doc})
    else:
        await db.submissions.insert_one(doc)
        await gamification.grant_badge(user["id"], "first_submission")

    return {k: v for k, v in doc.items() if k != "_id"}


@router.post("/activities/{activity_id}/submit-quiz")
async def submit_quiz(
    activity_id: str,
    data: QuizSubmission,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    gamification: GamificationService = Depends(get_gamification_service),
):
    user = await auth.require_role(request, "student")
    db = get_db(request)

    activity = await db.activities.find_one({"id": activity_id}, {"_id": 0})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity["type"] != "quiz":
        raise HTTPException(status_code=400, detail="Activity is not a quiz")

    enr = await db.enrollments.find_one({"student_id": user["id"], "course_id": activity["course_id"]})
    if not enr:
        raise HTTPException(status_code=403, detail="Not enrolled in course")

    questions = activity.get("quiz_questions", [])
    if len(data.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Answer count mismatch")

    correct = sum(1 for i, q in enumerate(questions) if data.answers[i] == q["correct_index"])
    total = len(questions)
    percent = round((correct / total) * 100) if total else 0
    score = round(percent * activity.get("max_points", 100) / 100)

    existing = await db.submissions.find_one({"activity_id": activity_id, "student_id": user["id"]})
    sub_id = existing["id"] if existing else str(uuid.uuid4())
    xp_awarded = 0

    if not existing:
        xp_awarded = round(activity.get("xp_reward", 50) * percent / 100)

    doc = {
        "id": sub_id,
        "activity_id": activity_id,
        "course_id": activity["course_id"],
        "student_id": user["id"],
        "student_name": user["name"],
        "type": "quiz",
        "answers": data.answers,
        "correct_count": correct,
        "total_count": total,
        "percent": percent,
        "score": score,
        "status": "graded",
        "feedback": f"Auto-graded: {correct}/{total} correct",
        "submitted_at": now_iso(),
        "graded_at": now_iso(),
        "xp_awarded": xp_awarded,
    }

    if existing:
        await db.submissions.update_one({"id": sub_id}, {"$set": doc})
    else:
        await db.submissions.insert_one(doc)
        await gamification.grant_badge(user["id"], "first_submission")
        if xp_awarded:
            await gamification.add_xp(user["id"], xp_awarded)
        if percent >= 90:
            await gamification.grant_badge(user["id"], "quiz_master")

    return {k: v for k, v in doc.items() if k != "_id"}


@router.get("/courses/{course_id}/submissions")
async def course_submissions(
    course_id: str,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.require_role(request, "teacher")
    db = get_db(request)

    course = await db.courses.find_one({"id": course_id})
    if not course or course["teacher_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    subs = await db.submissions.find(
        {"course_id": course_id}, {"_id": 0}
    ).sort("submitted_at", -1).to_list(500)

    for s in subs:
        a = await db.activities.find_one(
            {"id": s["activity_id"]}, {"_id": 0, "title": 1, "type": 1, "max_points": 1}
        )
        s["activity_title"] = a["title"] if a else "Deleted"
        s["activity_type"] = a["type"] if a else "?"
        s["max_points"] = a.get("max_points", 100) if a else 100

    return subs


@router.get("/me/submissions")
async def my_submissions(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.get_current_user(request)
    db = get_db(request)

    subs = await db.submissions.find(
        {"student_id": user["id"]}, {"_id": 0}
    ).sort("submitted_at", -1).to_list(500)

    for s in subs:
        a = await db.activities.find_one({"id": s["activity_id"]}, {"_id": 0})
        s["activity_title"] = a["title"] if a else "Deleted"
        s["activity_type"] = a["type"] if a else "?"
        s["max_points"] = a.get("max_points", 100) if a else 100

    return subs


@router.post("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    data: GradeRequest,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    gamification: GamificationService = Depends(get_gamification_service),
):
    user = await auth.require_role(request, "teacher")
    db = get_db(request)

    sub = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    course = await db.courses.find_one({"id": sub["course_id"]})
    if course["teacher_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your course")

    if sub["type"] != "assignment":
        raise HTTPException(status_code=400, detail="Only assignments can be manually graded")

    activity = await db.activities.find_one({"id": sub["activity_id"]}, {"_id": 0})
    already_graded = sub.get("status") == "graded"

    await db.submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "status": "graded",
            "score": data.score,
            "feedback": data.feedback,
            "graded_at": now_iso(),
        }},
    )

    if not already_graded:
        max_points = activity.get("max_points", 100)
        xp_reward = activity.get("xp_reward", 50)
        percent = data.score / max_points if max_points else 0
        xp_awarded = round(xp_reward * percent)

        if xp_awarded > 0:
            await gamification.add_xp(sub["student_id"], xp_awarded)
        if percent >= 0.9:
            await gamification.grant_badge(sub["student_id"], "quiz_master")

    return {"ok": True}
