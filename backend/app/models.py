from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Time, Table, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Association table for Workspace and Amenity (Many-to-Many)
workspace_amenity = Table(
    "workspace_amenity",
    Base.metadata,
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user") # 'user', 'owner', 'admin'
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="user", cascade="all, delete-orphan")

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # 'private_cabin', 'shared_desk', 'meeting_room'
    capacity = Column(Integer, nullable=False) # max persons
    area_size = Column(Float, nullable=False) # in sq ft
    price_per_hour = Column(Float, nullable=False)
    price_per_day = Column(Float, nullable=False)
    location = Column(String, nullable=False) # e.g. "San Francisco", "New York"
    address = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    rating = Column(Float, default=4.5)
    expectations = Column(String, default="") # comma-separated workstyle tags (e.g. "quiet,creative,corporate")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="workspaces")
    bookings = relationship("Booking", back_populates="workspace", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="workspace", cascade="all, delete-orphan")
    amenities = relationship("Amenity", secondary=workspace_amenity, back_populates="workspaces")

class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # e.g. "Wi-Fi", "Parking", "Cafeteria"
    icon = Column(String, nullable=True) # Icon keyword for frontend to render (e.g. "wifi", "local_parking", "coffee")

    workspaces = relationship("Workspace", secondary=workspace_amenity, back_populates="amenities")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending") # 'pending', 'approved', 'rejected', 'cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="bookings")
    user = relationship("User", back_populates="bookings")

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    reply = Column(Text, nullable=True)
    status = Column(String, default="pending") # 'pending', 'replied'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="inquiries")
    user = relationship("User", back_populates="inquiries")
