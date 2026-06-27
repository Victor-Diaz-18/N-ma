from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional

from services.auth_service import AuthService, get_auth_service
from services.notification_service import NotificationService
from dependencies import get_db

router = APIRouter()


def get_notification_service(request: Request) -> NotificationService:
    return NotificationService(get_db(request))


class MarkReadRequest(BaseModel):
    notification_id: str


@router.get("/notifications")
async def list_notifications(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    notification_svc: NotificationService = Depends(get_notification_service),
):
    user = await auth.get_current_user(request)
    items = await notification_svc.get_for_user(user["id"])
    unread = await notification_svc.get_unread_count(user["id"])
    return {"items": items, "unread_count": unread}


@router.get("/notifications/unread-count")
async def unread_count(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    notification_svc: NotificationService = Depends(get_notification_service),
):
    user = await auth.get_current_user(request)
    count = await notification_svc.get_unread_count(user["id"])
    return {"unread_count": count}


@router.post("/notifications/mark-read")
async def mark_read(
    data: MarkReadRequest,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    notification_svc: NotificationService = Depends(get_notification_service),
):
    user = await auth.get_current_user(request)
    ok = await notification_svc.mark_read(user["id"], data.notification_id)
    return {"ok": ok}


@router.post("/notifications/mark-all-read")
async def mark_all_read(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
    notification_svc: NotificationService = Depends(get_notification_service),
):
    user = await auth.get_current_user(request)
    count = await notification_svc.mark_all_read(user["id"])
    return {"marked": count}
