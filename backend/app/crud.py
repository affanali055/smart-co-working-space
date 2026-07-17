from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, date, time
from typing import List, Optional
from . import models, schemas, auth

# User operations
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_pw = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_pw,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role or "user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Amenity operations
def get_or_create_amenity(db: Session, name: str) -> models.Amenity:
    db_amenity = db.query(models.Amenity).filter(models.Amenity.name.ilike(name)).first()
    if not db_amenity:
        # Map some common icons
        icon = "star"
        lower_name = name.lower()
        if "wifi" in lower_name or "wi-fi" in lower_name:
            icon = "wifi"
        elif "park" in lower_name:
            icon = "local_parking"
        elif "cafe" in lower_name or "coffee" in lower_name or "food" in lower_name:
            icon = "coffee"
        elif "power" in lower_name or "backup" in lower_name or "generator" in lower_name:
            icon = "power"
        elif "meet" in lower_name or "room" in lower_name:
            icon = "groups"
        elif "security" in lower_name or "cctv" in lower_name:
            icon = "security"
        elif "ac" in lower_name or "conditioner" in lower_name or "cooling" in lower_name:
            icon = "ac_unit"
        elif "print" in lower_name:
            icon = "print"
            
        db_amenity = models.Amenity(name=name, icon=icon)
        db.add(db_amenity)
        db.commit()
        db.refresh(db_amenity)
    return db_amenity

# Workspace operations
def get_workspace_by_id(db: Session, workspace_id: int) -> Optional[models.Workspace]:
    return db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()

def get_workspaces(
    db: Session,
    location: Optional[str] = None,
    capacity: Optional[int] = None,
    min_area: Optional[float] = None,
    max_price: Optional[float] = None,
    workspace_type: Optional[str] = None,
    amenities: Optional[List[str]] = None
) -> List[models.Workspace]:
    query = db.query(models.Workspace)
    
    if location:
        query = query.filter(models.Workspace.location.ilike(f"%{location}%"))
    if capacity:
        query = query.filter(models.Workspace.capacity >= capacity)
    if min_area:
        query = query.filter(models.Workspace.area_size >= min_area)
    if max_price:
        query = query.filter(
            or_(
                models.Workspace.price_per_hour <= max_price,
                models.Workspace.price_per_day <= (max_price * 8) # Fallback heuristic
            )
        )
    if workspace_type:
        query = query.filter(models.Workspace.type == workspace_type)
        
    workspaces = query.all()
    
    # Filter by amenities in memory to keep it simple and robust for SQLAlchemy SQLite relations
    if amenities:
        filtered = []
        for w in workspaces:
            w_amenities = [a.name.lower() for a in w.amenities]
            if all(am.lower() in w_amenities for am in amenities):
                filtered.append(w)
        return filtered
        
    return workspaces

def create_workspace(db: Session, workspace: schemas.WorkspaceCreate, owner_id: int) -> models.Workspace:
    db_workspace = models.Workspace(
        name=workspace.name,
        owner_id=owner_id,
        type=workspace.type,
        capacity=workspace.capacity,
        area_size=workspace.area_size,
        price_per_hour=workspace.price_per_hour,
        price_per_day=workspace.price_per_day,
        location=workspace.location,
        address=workspace.address,
        description=workspace.description,
        image_url=workspace.image_url,
        expectations=workspace.expectations or ""
    )
    # Handle amenities
    for name in workspace.amenities:
        amenity = get_or_create_amenity(db, name)
        db_workspace.amenities.append(amenity)
        
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

def update_workspace(db: Session, workspace_id: int, workspace: schemas.WorkspaceUpdate) -> Optional[models.Workspace]:
    db_workspace = get_workspace_by_id(db, workspace_id)
    if not db_workspace:
        return None
        
    update_data = workspace.model_dump(exclude_unset=True)
    
    # Handle amenities list updates separately
    if "amenities" in update_data:
        amenity_names = update_data.pop("amenities")
        db_workspace.amenities.clear()
        for name in amenity_names:
            amenity = get_or_create_amenity(db, name)
            db_workspace.amenities.append(amenity)
            
    for key, value in update_data.items():
        setattr(db_workspace, key, value)
        
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

def delete_workspace(db: Session, workspace_id: int) -> bool:
    db_workspace = get_workspace_by_id(db, workspace_id)
    if not db_workspace:
        return False
    db.delete(db_workspace)
    db.commit()
    return True

# Booking operations
def check_workspace_availability(
    db: Session,
    workspace_id: int,
    booking_date: date,
    start_time: time,
    end_time: time
) -> bool:
    # Overlapping booking check:
    # A booking overlaps if: booking_date is same AND status is approved/pending AND
    # (start_time < existing.end_time AND end_time > existing.start_time)
    overlap = db.query(models.Booking).filter(
        models.Booking.workspace_id == workspace_id,
        models.Booking.booking_date == booking_date,
        models.Booking.status.in_(["approved", "pending"]),
        models.Booking.start_time < end_time,
        models.Booking.end_time > start_time
    ).first()
    return overlap is None

def create_booking(db: Session, booking: schemas.BookingCreate, user_id: int) -> models.Booking:
    workspace = get_workspace_by_id(db, booking.workspace_id)
    if not workspace:
        raise ValueError("Workspace not found")
        
    # Calculate total price
    # Booking duration in hours
    datetime_start = datetime.combine(booking.booking_date, booking.start_time)
    datetime_end = datetime.combine(booking.booking_date, booking.end_time)
    duration_hours = (datetime_end - datetime_start).total_seconds() / 3600.0
    
    # If duration >= 8 hours, cap or use price_per_day if smaller
    raw_hour_cost = duration_hours * workspace.price_per_hour
    total_price = min(raw_hour_cost, workspace.price_per_day) if duration_hours >= 6 else raw_hour_cost
    total_price = round(total_price, 2)
    
    db_booking = models.Booking(
        workspace_id=booking.workspace_id,
        user_id=user_id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        total_price=total_price,
        status="pending"
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_bookings_by_user(db: Session, user_id: int, role: str) -> List[models.Booking]:
    if role == "admin":
        return db.query(models.Booking).all()
    elif role == "owner":
        # Bookings for spaces owned by this owner
        return db.query(models.Booking).join(models.Workspace).filter(models.Workspace.owner_id == user_id).all()
    else:
        # Bookings made by this user
        return db.query(models.Booking).filter(models.Booking.user_id == user_id).all()

def update_booking_status(db: Session, booking_id: int, status: str) -> Optional[models.Booking]:
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        return None
    db_booking.status = status
    db.commit()
    db.refresh(db_booking)
    return db_booking

# Inquiry operations
def create_inquiry(db: Session, inquiry: schemas.InquiryCreate, user_id: int) -> models.Inquiry:
    db_inquiry = models.Inquiry(
        workspace_id=inquiry.workspace_id,
        user_id=user_id,
        message=inquiry.message,
        status="pending"
    )
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry

def get_inquiries_by_user(db: Session, user_id: int, role: str) -> List[models.Inquiry]:
    if role == "admin":
        return db.query(models.Inquiry).all()
    elif role == "owner":
        return db.query(models.Inquiry).join(models.Workspace).filter(models.Workspace.owner_id == user_id).all()
    else:
        return db.query(models.Inquiry).filter(models.Inquiry.user_id == user_id).all()

def reply_to_inquiry(db: Session, inquiry_id: int, reply: str) -> Optional[models.Inquiry]:
    db_inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    if not db_inquiry:
        return None
    db_inquiry.reply = reply
    db_inquiry.status = "replied"
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry
