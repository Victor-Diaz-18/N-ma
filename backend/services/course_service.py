import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.gamification_service import GamificationService


class CourseService:
    def __init__(self, db: AsyncIOMotorDatabase, gamification: GamificationService):
        self.db = db
        self.gamification = gamification

    def now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def create_course(
        self, title: str, description: str, subject: str, cover_color: str, teacher_id: str, teacher_name: str
    ) -> dict:
        course_id = str(uuid.uuid4())
        doc = {
            "id": course_id,
            "title": title,
            "description": description,
            "subject": subject,
            "cover_color": cover_color,
            "teacher_id": teacher_id,
            "teacher_name": teacher_name,
            "created_at": self.now_iso(),
        }
        await self.db.courses.insert_one(doc)
        return doc

    async def list_courses(self, user_id: str, skip: int = 0, limit: int = 12) -> List[dict]:
        courses = await self.db.courses.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
        for c in courses:
            c["student_count"] = await self.db.enrollments.count_documents(
                {"course_id": c["id"]}
            )
            c["is_enrolled"] = bool(
                await self.db.enrollments.find_one(
                    {"course_id": c["id"], "student_id": user_id}
                )
            )
        return courses

    async def count_courses(self) -> int:
        return await self.db.courses.count_documents({})

    async def get_my_courses(self, user_id: str, role: str) -> List[dict]:
        if role == "teacher":
            courses = await self.db.courses.find(
                {"teacher_id": user_id}, {"_id": 0}
            ).to_list(500)
        else:
            enrolls = await self.db.enrollments.find(
                {"student_id": user_id}, {"_id": 0}
            ).to_list(500)
            course_ids = [e["course_id"] for e in enrolls]
            courses = await self.db.courses.find(
                {"id": {"$in": course_ids}}, {"_id": 0}
            ).to_list(500)

        for c in courses:
            c["student_count"] = await self.db.enrollments.count_documents(
                {"course_id": c["id"]}
            )
            c["is_enrolled"] = role == "student"
        return courses

    async def get_course(self, course_id: str, user_id: str) -> dict:
        course = await self.db.courses.find_one({"id": course_id}, {"_id": 0})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        course["student_count"] = await self.db.enrollments.count_documents(
            {"course_id": course_id}
        )
        course["is_enrolled"] = bool(
            await self.db.enrollments.find_one(
                {"course_id": course_id, "student_id": user_id}
            )
        )
        course["is_owner"] = course["teacher_id"] == user_id
        return course

    async def enroll_student(self, course_id: str, student_id: str) -> dict:
        course = await self.db.courses.find_one({"id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        existing = await self.db.enrollments.find_one(
            {"course_id": course_id, "student_id": student_id}
        )
        if existing:
            return {"ok": True, "already": True}

        await self.db.enrollments.insert_one({
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "student_id": student_id,
            "enrolled_at": self.now_iso(),
        })

        await self.gamification.grant_badge(student_id, "first_enroll")
        count = await self.db.enrollments.count_documents({"student_id": student_id})
        if count >= 3:
            await self.gamification.grant_badge(student_id, "three_courses")

        return {"ok": True}

    async def delete_course(self, course_id: str, teacher_id: str) -> dict:
        course = await self.db.courses.find_one({"id": course_id})
        if not course or course["teacher_id"] != teacher_id:
            raise HTTPException(status_code=403, detail="Not your course")

        await self.db.courses.delete_one({"id": course_id})
        await self.db.lessons.delete_many({"course_id": course_id})
        await self.db.resources.delete_many({"course_id": course_id})
        await self.db.activities.delete_many({"course_id": course_id})
        await self.db.enrollments.delete_many({"course_id": course_id})
        return {"ok": True}
