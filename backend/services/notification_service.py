import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase


class NotificationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def create(self, user_id: str, title: str, message: str, link: str = None) -> dict:
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": title,
            "message": message,
            "link": link,
            "read": False,
            "created_at": self.now_iso(),
        }
        await self.db.notifications.insert_one(doc)
        return {k: v for k, v in doc.items() if k != "_id"}

    async def get_for_user(self, user_id: str, limit: int = 20) -> list:
        docs = await self.db.notifications.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return docs

    async def get_unread_count(self, user_id: str) -> int:
        return await self.db.notifications.count_documents(
            {"user_id": user_id, "read": False}
        )

    async def mark_read(self, user_id: str, notification_id: str) -> bool:
        result = await self.db.notifications.update_one(
            {"id": notification_id, "user_id": user_id},
            {"$set": {"read": True}}
        )
        return result.modified_count > 0

    async def mark_all_read(self, user_id: str) -> int:
        result = await self.db.notifications.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True}}
        )
        return result.modified_count
