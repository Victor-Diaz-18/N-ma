import uuid
from datetime import datetime, timezone
from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


class GamificationService:
    BADGES = [
        {"id": "first_enroll", "name": "Primeros Pasos", "description": "Te inscribiste en tu primer curso", "icon": "Compass", "color": "#A5D6A7"},
        {"id": "first_submission", "name": "Pionero", "description": "Entregaste tu primera actividad", "icon": "Rocket", "color": "#C5E1A5"},
        {"id": "quiz_master", "name": "Maestro del Quiz", "description": "Sacaste 90%+ en un quiz", "icon": "Trophy", "color": "#8BC34A"},
        {"id": "level_5", "name": "Estrella Naciente", "description": "Llegaste al Nivel 5", "icon": "Star", "color": "#FF6B6B"},
        {"id": "level_10", "name": "Erudito", "description": "Llegaste al Nivel 10", "icon": "GraduationCap", "color": "#2E8B7F"},
        {"id": "three_courses", "name": "Polímata", "description": "Te inscribiste en 3+ cursos", "icon": "BookOpen", "color": "#A5D6A7"},
    ]

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def xp_to_level(self, xp: int) -> int:
        return max(1, 1 + xp // 100)

    async def grant_badge(self, user_id: str, badge_id: str) -> bool:
        exists = await self.db.user_badges.find_one({"user_id": user_id, "badge_id": badge_id})
        if exists:
            return False
        await self.db.user_badges.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "badge_id": badge_id,
            "earned_at": self.now_iso(),
        })
        return True

    async def add_xp(self, user_id: str, amount: int, course_id: str = None) -> dict:
        if course_id:
            return await self.add_xp_to_course(user_id, amount, course_id)

        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return {"xp": 0, "level": 1, "new_level": False}

        new_xp = user.get("xp", 0) + amount
        new_level = self.xp_to_level(new_xp)
        old_level = user.get("level", 1)
        await self.db.users.update_one(
            {"id": user_id}, {"$set": {"xp": new_xp, "level": new_level}}
        )

        if new_level >= 5:
            await self.grant_badge(user_id, "level_5")
        if new_level >= 10:
            await self.grant_badge(user_id, "level_10")

        return {"xp": new_xp, "level": new_level, "new_level": new_level > old_level}

    async def add_xp_to_course(self, user_id: str, amount: int, course_id: str) -> dict:
        existing = await self.db.course_xp.find_one(
            {"student_id": user_id, "course_id": course_id}
        )
        if existing:
            new_xp = existing.get("xp", 0) + amount
            new_level = self.xp_to_level(new_xp)
            await self.db.course_xp.update_one(
                {"student_id": user_id, "course_id": course_id},
                {"$set": {"xp": new_xp, "level": new_level}}
            )
        else:
            new_xp = amount
            new_level = self.xp_to_level(new_xp)
            await self.db.course_xp.insert_one({
                "student_id": user_id,
                "course_id": course_id,
                "xp": new_xp,
                "level": new_level,
            })

        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            new_global_xp = user.get("xp", 0) + amount
            new_global_level = self.xp_to_level(new_global_xp)
            await self.db.users.update_one(
                {"id": user_id}, {"$set": {"xp": new_global_xp, "level": new_global_level}}
            )

        if new_level >= 5:
            await self.grant_badge(user_id, "level_5")
        if new_level >= 10:
            await self.grant_badge(user_id, "level_10")

        return {"xp": new_xp, "level": new_level, "new_level": new_level > (existing.get("level", 1) if existing else 0)}

    async def get_course_xp(self, user_id: str, course_id: str) -> dict:
        existing = await self.db.course_xp.find_one(
            {"student_id": user_id, "course_id": course_id}
        )
        if not existing:
            return {"xp": 0, "level": 1, "next_level_xp": 100, "progress_percent": 0}
        xp = existing.get("xp", 0)
        level = existing.get("level", 1)
        next_level_xp = level * 100
        progress_percent = int(((xp - (level - 1) * 100) / 100) * 100)
        return {"xp": xp, "level": level, "next_level_xp": next_level_xp, "progress_percent": progress_percent}

    async def get_user_stats(self, user_id: str) -> dict:
        user = await self.db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return {}

        badges_earned = await self.db.user_badges.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(100)
        earned_ids = {b["badge_id"] for b in badges_earned}

        all_badges = [
            {
                **b,
                "earned": b["id"] in earned_ids,
                "earned_at": next(
                    (be["earned_at"] for be in badges_earned if be["badge_id"] == b["id"]),
                    None,
                ),
            }
            for b in self.BADGES
        ]

        xp = user.get("xp", 0)
        level = self.xp_to_level(xp)
        next_level_xp = level * 100
        progress_percent = int(((xp - (level - 1) * 100) / 100) * 100)
        courses_enrolled = await self.db.enrollments.count_documents(
            {"student_id": user_id}
        )
        submissions_count = await self.db.submissions.count_documents(
            {"student_id": user_id}
        )

        return {
            "xp": xp,
            "level": level,
            "next_level_xp": next_level_xp,
            "progress_percent": progress_percent,
            "badges": all_badges,
            "earned_badges_count": len(earned_ids),
            "courses_enrolled": courses_enrolled,
            "submissions_count": submissions_count,
        }

    async def get_leaderboard(self, current_user_id: str, skip: int = 0, limit: int = 20) -> dict:
        total = await self.db.users.count_documents({"role": "student"})
        users = await self.db.users.find(
            {"role": "student"}, {"_id": 0, "password_hash": 0}
        ).sort("xp", -1).skip(skip).limit(limit).to_list(limit)

        result = []
        for i, u in enumerate(users):
            badge_count = await self.db.user_badges.count_documents({"user_id": u["id"]})
            course_xp_docs = await self.db.course_xp.find(
                {"student_id": u["id"]}
            ).to_list(100)
            total_course_xp = sum(c.get("xp", 0) for c in course_xp_docs)
            result.append({
                "rank": skip + i + 1,
                "id": u["id"],
                "name": u["name"],
                "xp": total_course_xp,
                "level": max((c.get("level", 1) for c in course_xp_docs), default=1),
                "avatar_color": u.get("avatar_color", "#FFE156"),
                "badge_count": badge_count,
                "is_me": u["id"] == current_user_id,
            })
        pages = max(1, (total + limit - 1) // limit)
        return {"items": result, "total": total, "page": skip // limit + 1, "pages": pages}
