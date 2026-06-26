import uuid
import base64
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class FileService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def validate_content_type(self, content_type: str) -> bool:
        if content_type is None:
            return False
        return content_type in ALLOWED_CONTENT_TYPES

    async def upload_file(self, file: UploadFile, owner_id: str) -> dict:
        if not self.validate_content_type(file.content_type):
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no permitido: {file.content_type}",
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, detail="Archivo demasiado grande (máximo 10MB)"
            )

        file_id = str(uuid.uuid4())
        await self.db.files.insert_one({
            "id": file_id,
            "filename": file.filename,
            "content_type": file.content_type or "application/octet-stream",
            "data_b64": base64.b64encode(content).decode("ascii"),
            "size": len(content),
            "owner_id": owner_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        return {
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
        }

    async def get_file(self, file_id: str) -> dict:
        f = await self.db.files.find_one({"id": file_id}, {"_id": 0})
        if not f:
            raise HTTPException(status_code=404, detail="File not found")
        return f
