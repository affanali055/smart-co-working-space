from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, time
from typing import List
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/bookings", tags=["Bookings & Schedule"])

@router.get("/check-availability")
def check_availability(
    workspace_id: int,
    booking_date: date,
    start_time: time,
    end_time: time,
    db: Session = Depends(get_db)
):
    available = crud.check_workspace_availability(db, workspace_id, booking_date, start_time, end_time)
    return {"available": available}

@router.post("/", response_model=schemas.BookingOut, status_code=status.HTTP_201_CREATED)
def create_new_booking(
    booking: schemas.BookingCreate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check availability
    available = crud.check_workspace_availability(
        db, booking.workspace_id, booking.booking_date, booking.start_time, booking.end_time
    )
    if not available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The workspace is already booked for the selected date and time range."
        )
        
    try:
        new_booking = crud.create_booking(db, booking, current_user.id)
        
        # Log WhatsApp notification details on console
        try:
            whatsapp_number = '9380747558'
            formatted_phone = whatsapp_number if whatsapp_number.startswith('91') else f"91{whatsapp_number}"
            workspace_name = new_booking.workspace.name if new_booking.workspace else "Workspace"
            customer_name = current_user.full_name or "Customer"
            customer_email = current_user.email or "N/A"
            
            message = (
                f"Hello! I have requested a workspace booking on Smart Co-working Space:\n\n"
                f"🏢 Workspace: {workspace_name}\n"
                f"📅 Date: {new_booking.booking_date}\n"
                f"⏰ Time: {new_booking.start_time} - {new_booking.end_time}\n"
                f"💰 Total Price: ${new_booking.total_price}\n"
                f"👤 Customer: {customer_name} ({customer_email})\n\n"
                f"Please review and approve my booking. Thank you!"
            )
            import urllib.parse
            encoded_msg = urllib.parse.quote(message)
            whatsapp_url = f"https://api.whatsapp.com/send?phone={formatted_phone}&text={encoded_msg}"
            print(f"\n[WHATSAPP NOTIFICATION ALERT] Booking ID: {new_booking.id}")
            print(f"Recipient Phone: +{formatted_phone}")
            print(f"Notification Link: {whatsapp_url}\n")
        except Exception as log_err:
            print(f"Failed to log WhatsApp notification details: {log_err}")
            
        return new_booking
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/my-bookings", response_model=List[schemas.BookingOut])
def get_my_bookings(
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_bookings_by_user(db, current_user.id, current_user.role)

@router.put("/{booking_id}/status", response_model=schemas.BookingOut)
def update_booking_status(
    booking_id: int,
    payload: schemas.BookingStatusUpdate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
        
    # Check authorization based on requested state:
    # 1. To Approve/Reject: Current user must be the space owner or admin
    # 2. To Cancel: Current user must be the booking user, space owner, or admin
    workspace = db_booking.workspace
    
    if payload.status in ["approved", "rejected"]:
        if current_user.role != "admin" and workspace.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the space owner or an administrator can approve or reject booking requests."
            )
    elif payload.status == "cancelled":
        if current_user.role != "admin" and db_booking.user_id != current_user.id and workspace.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this booking."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'approved', 'rejected', or 'cancelled'."
        )
        
    return crud.update_booking_status(db, booking_id, payload.status)
