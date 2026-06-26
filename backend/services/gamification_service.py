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

    async def add_xp(self, user_id: str, amount: int) -> dict:
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

    async def get_leaderboard(self, current_user_id: str) -> List[dict]:
        users = await self.db.users.find(
            {"role": "student"}, {"_id": 0, "password_hash": 0}
        ).sort("xp", -1).limit(50).to_list(50)

        result = []
        for i, u in enumerate(users):
            badge_count = await self.db.user_badges.count_documents({"user_id": u["id"]})
            result.append({
                "rank": i + 1,
                "id": u["id"],
                "name": u["name"],
                "xp": u.get("xp", 0),
                "level": u.get("level", 1),
                "avatar_color": u.get("avatar_color", "#FFE156"),
                "badge_count": badge_count,
                "is_me": u["id"] == current_user_id,
            })
        return result
