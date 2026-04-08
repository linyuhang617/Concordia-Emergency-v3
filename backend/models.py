import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from database import Base

def new_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True, default=new_uuid)
    username      = Column(String, unique=True, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role          = Column(String, default='student')
    accessibility = Column(JSON, default=list)
    created_at    = Column(DateTime, default=datetime.utcnow)


class UserPrefs(Base):
    __tablename__ = "user_prefs"

    user_id                  = Column(String, primary_key=True)
    notification_protest     = Column(String, default="true")
    notification_construction= Column(String, default="true")
    notification_weather     = Column(String, default="true")
    notification_elevator    = Column(String, default="true")
    notification_general     = Column(String, default="true")
    quiet_hours_enabled      = Column(String, default="false")
    quiet_hours_start        = Column(String, default="22:00")
    quiet_hours_end          = Column(String, default="07:00")
    route_preference         = Column(String, default="fastest")
    elevator_preference      = Column(String, default="prioritize")
    text_size                = Column(String, default="medium")
    color_mode               = Column(String, default="standard")
    safety                   = Column(JSON, default=list)


class Alert(Base):
    __tablename__ = "alerts"

    id            = Column(String, primary_key=True, default=new_uuid)
    type          = Column(String, nullable=False)
    building_code = Column(String, nullable=False)
    location_lat  = Column(String, nullable=False)
    location_lng  = Column(String, nullable=False)
    description   = Column(String, nullable=False)
    status        = Column(String, default="PENDING")
    verification  = Column(String, default="")
    report_count  = Column(Integer, default=1)
    reported_by   = Column(String, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow)
