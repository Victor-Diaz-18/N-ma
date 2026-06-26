from fastapi import APIRouter, Depends, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.user import UserCreate, UserLogin
from services.auth_service import AuthService
from config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(request: Request) -> AuthService:
    return request.app.state.auth_service


@router.post("/register")
async def register(
    data: UserCreate,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.register(data.name, data.email, data.password, data.role)
    token = auth.create_access_token(user["id"], user["email"])
    auth.set_auth_cookie(response, token)
    return {"user": auth.clean_user(user), "token": token}


@router.post("/login")
async def login(
    data: UserLogin,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.login(data.email, data.password)
    token = auth.create_access_token(user["id"], user["email"])
    auth.set_auth_cookie(response, token)
    return {"user": auth.clean_user(user), "token": token}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@router.get("/me")
async def me(
    request: Request,
    auth: AuthService = Depends(get_auth_service),
):
    user = await auth.get_current_user(request)
    return auth.clean_user(user)
