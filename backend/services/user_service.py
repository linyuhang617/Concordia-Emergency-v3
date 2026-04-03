from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import User, UserPrefs

async def get_prefs(user_id: str, db: AsyncSession):
    result = await db.execute(select(UserPrefs).where(UserPrefs.user_id == user_id))
    return result.scalar_one_or_none()

async def update_prefs(user_id: str, data: dict, db: AsyncSession):
    result = await db.execute(select(UserPrefs).where(UserPrefs.user_id == user_id))
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = UserPrefs(user_id=user_id)
        db.add(prefs)
    for key, value in data.items():
        if value is not None:
            setattr(prefs, key, value)
    await db.commit()
    await db.refresh(prefs)
    return prefs

async def update_profile(user_id: str, data: dict, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user
