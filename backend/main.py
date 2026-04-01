from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, AsyncSessionLocal
from routers import auth, users, alerts
from models import Alert
from datetime import datetime

app = FastAPI(title="Concordia Emergency V2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://concordia.ailasai.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(alerts.router)

SEED_ALERTS = [
    {"type": "Protest",             "building_code": "H",  "location_lat": "45.4972", "location_lng": "-73.5788", "description": "Large gathering blocking front entrance",       "status": "ACTIVE",       "verification": "Reported by 1 student",      "created_at": datetime(2024, 1, 1, 12, 40)},
    {"type": "Elevator Malfunction","building_code": "LB", "location_lat": "45.4969", "location_lng": "-73.5786", "description": "Elevator out of service on floors 2-4",         "status": "UNDER REVIEW", "verification": "Reported by 3 students",     "created_at": datetime(2024, 1, 1, 14, 14)},
    {"type": "Construction",        "building_code": "EV", "location_lat": "45.4957", "location_lng": "-73.5778", "description": "Sidewalk partially blocked near main entrance", "status": "ACTIVE",       "verification": "Verified by Campus Safety",  "created_at": datetime(2024, 1, 1,  9,  0)},
    {"type": "Weather Hazard",      "building_code": "GM", "location_lat": "45.4959", "location_lng": "-73.5790", "description": "Icy sidewalk near main entrance cleared",       "status": "RESOLVED",     "verification": "Verified by Campus Safety",  "created_at": datetime(2024, 1, 1,  8, 30)},
    {"type": "Elevator Malfunction","building_code": "H",  "location_lat": "45.4972", "location_lng": "-73.5788", "description": "Elevator on floors 8-12 back in service",       "status": "RESOLVED",     "verification": "Reported by 2 students",     "created_at": datetime(2024, 1, 1, 11,  0)},
]

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_alerts()

async def seed_alerts():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(Alert))
        if result.scalars().first():
            return
        for data in SEED_ALERTS:
            db.add(Alert(**data))
        await db.commit()

@app.get("/")
async def root():
    return {"status": "Concordia Emergency V2 running"}
