import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from config import get_settings


class AuthService:
    JWT_ALGORITHM = "HS256"

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.settings = get_settings()

    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify_password(self, plain: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False

    def create_access_token(self, user_id: str, email: str) -> str:
        payload = {
            "sub": user_id,
            "email": email,
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
        }
        return jwt.encode(payload, self.settings.jwt_secret, algorithm=self.JWT_ALGORITHM)

    def set_auth_cookie(self, response: Response, token: str):
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=604800,
            path="/",
        )

    async def get_current_user(self, request: Request) -> dict:
        token = request.cookies.get("access_token")
        if not token:
            auth = request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                token = auth[7:]
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = jwt.decode(
                token, self.settings.jwt_secret, algorithms=[self.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await self.db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user

    async def require_role(self, request: Request, *roles: str) -> dict:
        user = await self.get_current_user(request)
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden: wrong role")
        return user

    def clean_user(self, u: dict) -> dict:
        if not u:
            return u
        return {
            "id": u["id"],
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "xp": u.get("xp", 0),
            "level": u.get("level", 1),
            "avatar_color": u.get("avatar_color", "#FFE156"),
            "created_at": u.get("created_at"),
        }

    async def register(self, name: str, email: str, password: str, role: str) -> dict:
        email = email.lower()
        existing = await self.db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": email,
            "name": name,
            "password_hash": self.hash_password(password),
            "role": role,
            "xp": 0,
            "level": 1,
            "avatar_color": "#FFE156",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await self.db.users.insert_one(user_doc)
        return user_doc

    async def login(self, email: str, password: str) -> dict:
        email = email.lower()
        user = await self.db.users.find_one({"email": email})
        if not user or not self.verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return user
