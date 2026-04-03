from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies import get_db, get_current_user
from services import alert_service
from schemas import AlertResponse, CreateAlertRequest, UpdateAlertRequest
from models import User

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

def format_alert(a):
    return AlertResponse(
        id=a.id,
        type=a.type,
        building_code=a.building_code,
        location_lat=str(a.location_lat),
        location_lng=str(a.location_lng),
        description=a.description,
        status=a.status,
        verification=a.verification,
        report_count=a.report_count,
        reported_by=a.reported_by,
        created_at=a.created_at.strftime("%-I:%M %p")
    )

@router.get("", response_model=list[AlertResponse])
async def get_alerts(db: AsyncSession = Depends(get_db)):
    alerts = await alert_service.get_all(db)
    return [format_alert(a) for a in alerts]

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    alert = await alert_service.get_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return format_alert(alert)

@router.post("", response_model=AlertResponse)
async def create_alert(
    data: CreateAlertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not data.description or not data.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")
    alert = await alert_service.create_alert(db, {
        **data.model_dump(),
        "status": "PENDING",
        "reported_by": current_user.id
    })
    return format_alert(alert)

@router.patch("/{alert_id}/approve", response_model=AlertResponse)
async def approve_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'staff':
        raise HTTPException(status_code=403, detail="Staff only")
    alert = await alert_service.update_alert(db, alert_id, {"status": "ACTIVE"})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return format_alert(alert)

@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    data: UpdateAlertRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.status == 'RESOLVED' and current_user.role != 'staff':
        raise HTTPException(status_code=403, detail="Staff only")
    alert = await alert_service.update_alert(db, alert_id, data.model_dump(exclude_none=True))
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return format_alert(alert)
