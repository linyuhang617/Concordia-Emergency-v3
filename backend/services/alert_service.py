from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Alert

async def get_all(db: AsyncSession):
    result = await db.execute(select(Alert).order_by(Alert.created_at.desc()))
    return result.scalars().all()

async def get_by_id(db: AsyncSession, alert_id: str):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    return result.scalar_one_or_none()

async def create_alert(db: AsyncSession, data: dict):
    import uuid
    from datetime import datetime

    # Check for existing PENDING or ACTIVE alert with same building_code + type
    result = await db.execute(
        select(Alert).where(
            Alert.building_code == data["building_code"],
            Alert.type == data["type"],
            Alert.status.in_(["PENDING", "ACTIVE"])
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.report_count += 1
        existing.verification = f"Reported by {existing.report_count} student{"s" if existing.report_count > 1 else ""}"
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing

    alert = Alert(
        id=str(uuid.uuid4()),
        type=data["type"],
        building_code=data["building_code"],
        location_lat=data["location_lat"],
        location_lng=data["location_lng"],
        description=data["description"],
        status=data.get("status", "PENDING"),
        verification=data.get("verification", "Reported by 1 student"),
        report_count=1,
        reported_by=data.get("reported_by"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert

async def update_alert(db: AsyncSession, alert_id: str, data: dict):
    from datetime import datetime
    alert = await get_by_id(db, alert_id)
    if not alert:
        return None
    if data.get("status"):
        alert.status = data["status"]
    if data.get("increment_count"):
        alert.report_count += 1
        alert.verification = f"Reported by {alert.report_count} student{"s" if alert.report_count > 1 else ""}"
    alert.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(alert)
    return alert
