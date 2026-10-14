import uuid
import base64
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket

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
        self.bucket = AsyncIOMotorGridFSBucket(db, bucket_name="uploads")

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
        await self.bucket.upload_from_stream(
            file.filename,
            content,
            metadata={
                "id": file_id,
                "content_type": file.content_type or "application/octet-stream",
                "owner_id": owner_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        return {
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
        }

    async def get_file(self, file_id: str) -> dict:
        doc = await self.db["uploads.files"].find_one({"metadata.id": file_id})
        if doc:
            return {
                "id": file_id,
                "gridfs_oid": doc["_id"],
                "filename": doc["filename"],
                "content_type": doc["metadata"].get("content_type", "application/octet-stream"),
                "owner_id": doc["metadata"].get("owner_id"),
                "size": doc.get("length", 0),
            }

        # Fallback: files uploaded before the move to GridFS, stored as base64.
        legacy = await self.db.files.find_one({"id": file_id}, {"_id": 0})
        if legacy:
            return legacy

        raise HTTPException(status_code=404, detail="File not found")

    async def stream_file(self, f: dict):
        if f.get("gridfs_oid") is not None:
            grid_out = await self.bucket.open_download_stream(f["gridfs_oid"])

            async def chunks():
                while True:
                    chunk = await grid_out.readchunk()
                    if not chunk:
                        break
                    yield chunk

            return chunks()

        data = base64.b64decode(f["data_b64"])

        async def legacy_chunk():
            yield data

        return legacy_chunk()

    async def get_authorized_file(self, file_id: str, user: dict) -> dict:
        f = await self.get_file(file_id)

        if f["owner_id"] == user["id"]:
            return f

        resource = await self.db.resources.find_one({"file_id": file_id})
        if resource:
            course = await self.db.courses.find_one({"id": resource["course_id"]})
            if course and course["teacher_id"] == user["id"]:
                return f
            enrolled = await self.db.enrollments.find_one(
                {"course_id": resource["course_id"], "student_id": user["id"]}
            )
            if enrolled:
                return f

        submission = await self.db.submissions.find_one({"file_id": file_id})
        if submission:
            course = await self.db.courses.find_one({"id": submission["course_id"]})
            if course and course["teacher_id"] == user["id"]:
                return f

        raise HTTPException(status_code=403, detail="No tienes acceso a este archivo")
