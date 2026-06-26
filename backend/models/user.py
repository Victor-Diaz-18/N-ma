from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["teacher", "student"] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    xp: int = 0
    level: int = 1
    avatar_color: str = "#FFE156"
    created_at: Optional[str] = None


class UserInDB(BaseModel):
    id: str
    email: str
    name: str
    password_hash: str
    role: str
    xp: int = 0
    level: int = 1
    avatar_color: str = "#FFE156"
    created_at: Optional[str] = None
