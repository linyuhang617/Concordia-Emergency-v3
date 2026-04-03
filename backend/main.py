from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, AsyncSessionLocal
from routers import auth, users, alerts
from models import User
from services.auth_service import hash_password

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

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_staff()

async def seed_staff():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.username == 'staff'))
        if result.scalar_one_or_none():
            return
        staff = User(
            username='staff',
            email='staff@concordia.ca',
            password_hash=hash_password('campus123'),
            role='staff',
            accessibility=[]
        )
        db.add(staff)
        await db.commit()

@app.get("/")
async def root():
    return {"status": "Concordia Emergency V2 running"}
