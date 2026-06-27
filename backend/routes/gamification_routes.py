from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.auth_service import AuthService
from services.gamification_service import GamificationService

router = APIRouter(prefix="/api", tags=["gamification"])


def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service


def get_gamification_service(request: Request) -> GamificationService:
    return request.app.state.gamification_service


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


@router.get("/me/stats")
async def my_stats(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    gamification: GamificationService = Depends(get_gamification_service),
):
    user = await auth.get_current_user(request)
    return await gamification.get_user_stats(user["id"])


@router.get("/me/upcoming")
async def upcoming_activities(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.get_current_user(request)
    db = get_db(request)

    enrolls = await db.enrollments.find(
        {"student_id": user["id"]}, {"_id": 0}
    ).to_list(500)
    course_ids = [e["course_id"] for e in enrolls]

    if not course_ids:
        return []

    activities = await db.activities.find(
        {"course_id": {"$in": course_ids}}, {"_id": 0}
    ).to_list(500)

    result = []
    for a in activities:
        sub = await db.submissions.find_one(
            {"activity_id": a["id"], "student_id": user["id"]}, {"_id": 0}
        )
        if sub:
            continue

        course = await db.courses.find_one({"id": a["course_id"]}, {"_id": 0})
        result.append({
            "id": a["id"],
            "title": a["title"],
            "type": a["type"],
            "due_date": a.get("due_date"),
            "xp_reward": a.get("xp_reward", 50),
            "course_id": a["course_id"],
            "course_title": course["title"] if course else "",
            "course_color": course.get("cover_color", "#8BC34A") if course else "#8BC34A",
        })

    result.sort(key=lambda x: (x.get("due_date") is None, x.get("due_date") or ""))
    return result[:10]


@router.get("/leaderboard")
async def leaderboard(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    gamification: GamificationService = Depends(get_gamification_service),
    page: int = 1,
    limit: int = 20,
):
    user = await auth.get_current_user(request)
    skip = (max(page, 1) - 1) * limit
    return await gamification.get_leaderboard(user["id"], skip=skip, limit=limit)


@router.get("/me/teacher-stats")
async def teacher_stats(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.require_role(request, "teacher")
    db = get_db(request)

    courses = await db.courses.find(
        {"teacher_id": user["id"]}, {"_id": 0}
    ).to_list(500)

    total_students = 0
    total_submissions = 0
    graded_submissions = 0
    total_score = 0

    for c in courses:
        count = await db.enrollments.count_documents({"course_id": c["id"]})
        total_students += count

        subs = await db.submissions.find(
            {"course_id": c["id"]}, {"_id": 0}
        ).to_list(500)
        total_submissions += len(subs)

        for s in subs:
            if s.get("status") == "graded" and s.get("score") is not None:
                graded_submissions += 1
                total_score += s["score"] / (s.get("max_points") or 100) * 100

    avg_score = round(total_score / graded_submissions) if graded_submissions > 0 else 0

    return {
        "total_courses": len(courses),
        "total_students": total_students,
        "total_submissions": total_submissions,
        "graded_submissions": graded_submissions,
        "avg_score_percent": avg_score,
    }
