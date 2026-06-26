import io
import base64

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.responses import StreamingResponse

from services.auth_service import AuthService
from services.file_service import FileService

router = APIRouter(prefix="/api", tags=["files"])


def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service


def get_file_service(request: Request) -> FileService:
    return request.app.state.file_service


@router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    request: Request = None,
    auth: AuthService = Depends(get_auth_service),
    file_svc: FileService = Depends(get_file_service),
):
    user = await auth.get_current_user(request)
    return await file_svc.upload_file(file, user["id"])


@router.get("/files/{file_id}")
async def get_file(
    file_id: str,
    file_svc: FileService = Depends(get_file_service),
):
    f = await file_svc.get_file(file_id)
    data = base64.b64decode(f["data_b64"])
    return StreamingResponse(
        io.BytesIO(data),
        media_type=f["content_type"],
        headers={"Content-Disposition": f'inline; filename="{f["filename"]}"'},
    )
