from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date, time
from typing import List, Optional

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Amenity Schemas
class AmenityBase(BaseModel):
    name: str
    icon: Optional[str] = None

class AmenityCreate(AmenityBase):
    pass

class AmenityOut(AmenityBase):
    id: int

    model_config = {"from_attributes": True}

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = "user" # 'user', 'owner', 'admin'

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

# Workspace Schemas
class WorkspaceBase(BaseModel):
    name: str
    type: str # 'private_cabin', 'shared_desk', 'meeting_room'
    capacity: int
    area_size: float
    price_per_hour: float
    price_per_day: float
    location: str
    address: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    expectations: Optional[str] = "" # comma-separated tags e.g. "quiet,creative"

class WorkspaceCreate(WorkspaceBase):
    amenities: List[str] = [] # List of amenity names

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    area_size: Optional[float] = None
    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    location: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    expectations: Optional[str] = None
    amenities: Optional[List[str]] = None

class WorkspaceOut(WorkspaceBase):
    id: int
    owner_id: int
    rating: float
    created_at: datetime
    amenities: List[AmenityOut] = []

    model_config = {"from_attributes": True}

# Booking Schemas
class BookingBase(BaseModel):
    workspace_id: int
    booking_date: date
    start_time: time
    end_time: time

class BookingCreate(BookingBase):
    pass

class BookingOut(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    booking_date: date
    start_time: time
    end_time: time
    total_price: float
    status: str
    created_at: datetime
    workspace: Optional[WorkspaceOut] = None
    user: Optional[UserOut] = None

    model_config = {"from_attributes": True}

class BookingStatusUpdate(BaseModel):
    status: str # 'approved', 'rejected', 'cancelled'

# Inquiry Schemas
class InquiryBase(BaseModel):
    workspace_id: int
    message: str

class InquiryCreate(InquiryBase):
    pass

class InquiryReply(BaseModel):
    reply: str

class InquiryOut(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    message: str
    reply: Optional[str] = None
    status: str
    created_at: datetime
    workspace: Optional[WorkspaceOut] = None
    user: Optional[UserOut] = None

    model_config = {"from_attributes": True}

# Dashboard Schemas
class UserDashboardMetrics(BaseModel):
    total_bookings: int
    approved_bookings: int
    pending_bookings: int
    total_spent: float

class OwnerDashboardMetrics(BaseModel):
    total_workspaces: int
    total_bookings: int
    pending_approvals: int
    total_revenue: float
    occupancy_rate: float # Percentage of booked hours vs total business hours
    monthly_earnings: List[float] = []

class AdminDashboardMetrics(BaseModel):
    total_users: int
    total_owners: int
    total_workspaces: int
    total_bookings: int
    total_revenue: float
    booking_conversion_rate: float
