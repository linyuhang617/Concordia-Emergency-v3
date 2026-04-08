from pydantic import BaseModel
from typing import List, Optional

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    accessibility: List[str] = []

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str = 'student'
    accessibility: List[str] = []

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class PrefsResponse(BaseModel):
    user_id: str
    notification_protest: str
    notification_construction: str
    notification_weather: str
    notification_elevator: str
    notification_general: str
    quiet_hours_enabled: str
    quiet_hours_start: str
    quiet_hours_end: str
    route_preference: str
    elevator_preference: str
    text_size: str
    color_mode: str
    safety: List[str] = []

class UpdatePrefsRequest(BaseModel):
    notification_protest: Optional[str] = None
    notification_construction: Optional[str] = None
    notification_weather: Optional[str] = None
    notification_elevator: Optional[str] = None
    notification_general: Optional[str] = None
    quiet_hours_enabled: Optional[str] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    route_preference: Optional[str] = None
    elevator_preference: Optional[str] = None
    text_size: Optional[str] = None
    color_mode: Optional[str] = None
    safety: Optional[List[str]] = None

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    accessibility: Optional[List[str]] = None

class AlertResponse(BaseModel):
    id: str
    type: str
    building_code: str
    location_lat: str
    location_lng: str
    description: str
    status: str
    verification: str = "Reported by 1 student"
    report_count: int = 1
    reported_by: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class CreateAlertRequest(BaseModel):
    type: str
    building_code: str
    location_lat: str
    location_lng: str
    description: str
    status: str = "UNDER REVIEW"
    verification: str = "Reported by 1 student"

class UpdateAlertRequest(BaseModel):
    increment_count: Optional[bool] = None
    status: Optional[str] = None
    verification: Optional[str] = None
