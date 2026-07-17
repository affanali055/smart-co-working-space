from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/inquiries", tags=["Inquiries & Expectation Matches"])

@router.post("/", response_model=schemas.InquiryOut, status_code=status.HTTP_201_CREATED)
def create_new_inquiry(
    inquiry: schemas.InquiryCreate,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_inquiry(db, inquiry, current_user.id)

@router.get("/my-inquiries", response_model=List[schemas.InquiryOut])
def get_my_inquiries(
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_inquiries_by_user(db, current_user.id, current_user.role)

@router.post("/{inquiry_id}/reply", response_model=schemas.InquiryOut)
def reply_to_client_inquiry(
    inquiry_id: int,
    payload: schemas.InquiryReply,
    current_user = Depends(auth.RoleChecker(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    db_inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    if not db_inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
        
    workspace = db_inquiry.workspace
    if current_user.role != "admin" and workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reply to this inquiry. You are not the owner of this workspace."
        )
        
    return crud.reply_to_inquiry(db, inquiry_id, payload.reply)
