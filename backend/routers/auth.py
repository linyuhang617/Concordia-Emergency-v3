from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import AsyncSessionLocal
from models import User, UserPrefs
from schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from services.auth_service import hash_password, verify_password, create_token
from dependencies import get_db, get_current_user
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=TokenResponse)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check username
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists.")

    # Check email
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already in use.")

    user = User(
        id=str(uuid.uuid4()),
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        accessibility=data.accessibility
    )
    db.add(user)

    # Auto-create prefs
    prefs = UserPrefs(user_id=user.id)
    db.add(prefs)

    await db.commit()

    token = create_token(user.id)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user.id, username=user.username, email=user.email, accessibility=user.accessibility)
    )

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_token(user.id)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user.id, username=user.username, email=user.email, accessibility=user.accessibility)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        accessibility=current_user.accessibility or []
    )
