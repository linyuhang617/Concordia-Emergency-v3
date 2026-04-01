from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies import get_db, get_current_user
from schemas import PrefsResponse, UpdatePrefsRequest, UpdateProfileRequest, UserResponse
from services import user_service
from models import User

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me/prefs", response_model=PrefsResponse)
async def get_prefs(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    prefs = await user_service.get_prefs(current_user.id, db)
    if not prefs:
        raise HTTPException(status_code=404, detail="Prefs not found")
    return prefs

@router.put("/me/prefs", response_model=PrefsResponse)
async def update_prefs(body: UpdatePrefsRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    prefs = await user_service.update_prefs(current_user.id, body.dict(), db)
    return prefs

@router.put("/me/profile", response_model=UserResponse)
async def update_profile(body: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await user_service.update_profile(current_user.id, body.dict(), db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
