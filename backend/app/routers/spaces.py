from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from ..database import get_db
from .. import schemas, crud, auth, models

router = APIRouter(prefix="/spaces", tags=["Workspaces"])

def calculate_match_score(
    workspace: models.Workspace,
    match_location: Optional[str] = None,
    match_capacity: Optional[int] = None,
    match_price: Optional[float] = None,
    match_amenities: Optional[List[str]] = None,
    match_expectations: Optional[str] = None
) -> float:
    # Weights: Location (20%), Capacity (25%), Budget (25%), Amenities (20%), Expectations (10%)
    scores = []
    weights = []

    # 1. Location match (20%)
    if match_location and match_location.strip():
        if match_location.lower() in workspace.location.lower():
            scores.append(100.0)
        else:
            scores.append(20.0) # Partial matches or same region could be added, keep it simple
        weights.append(0.20)
    else:
        scores.append(100.0)
        weights.append(0.20)

    # 2. Capacity match (25%)
    if match_capacity and match_capacity > 0:
        if workspace.capacity >= match_capacity:
            # Penalty for excessive capacity (wasting space)
            diff = workspace.capacity - match_capacity
            cap_score = max(30.0, 100.0 - (diff * 8)) # max 100%, min 30% if too large
            scores.append(cap_score)
        else:
            scores.append(0.0) # Cannot accommodate
        weights.append(0.25)
    else:
        scores.append(100.0)
        weights.append(0.25)

    # 3. Budget match (25%)
    if match_price and match_price > 0:
        # Check against price per hour. If they gave a daily price, divide by 8
        w_price = workspace.price_per_hour
        if w_price <= match_price:
            scores.append(100.0)
        else:
            # Over budget penalty
            over = w_price - match_price
            price_score = max(0.0, 100.0 - (over / match_price * 100.0))
            scores.append(price_score)
        weights.append(0.25)
    else:
        scores.append(100.0)
        weights.append(0.25)

    # 4. Amenities match (20%)
    if match_amenities and len(match_amenities) > 0:
        w_amenities = [a.name.lower() for a in workspace.amenities]
        matched_count = sum(1 for am in match_amenities if am.lower() in w_amenities)
        am_score = (matched_count / len(match_amenities)) * 100.0
        scores.append(am_score)
        weights.append(0.20)
    else:
        scores.append(100.0)
        weights.append(0.20)

    # 5. Expectations / Work style match (10%)
    if match_expectations and match_expectations.strip():
        req_tags = [t.strip().lower() for t in match_expectations.split(",") if t.strip()]
        w_tags = [t.strip().lower() for t in workspace.expectations.split(",") if t.strip()]
        if req_tags:
            matched_tags = sum(1 for tag in req_tags if tag in w_tags)
            style_score = (matched_tags / len(req_tags)) * 100.0
            scores.append(style_score)
            weights.append(0.10)
        else:
            scores.append(100.0)
            weights.append(0.10)
    else:
        scores.append(100.0)
        weights.append(0.10)

    # Calculate weighted average
    total_score = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
    return round(total_score, 1)

@router.get("/", response_model=List[schemas.WorkspaceOut])
def get_all_spaces(
    location: Optional[str] = None,
    capacity: Optional[int] = None,
    min_area: Optional[float] = None,
    max_price: Optional[float] = None,
    workspace_type: Optional[str] = None,
    amenities: Optional[List[str]] = Query(None),
    # Matching params
    match_location: Optional[str] = None,
    match_capacity: Optional[int] = None,
    match_price: Optional[float] = None,
    match_amenities: Optional[List[str]] = Query(None),
    match_expectations: Optional[str] = None,
    db: Session = Depends(get_db)
):
    workspaces = crud.get_workspaces(
        db, location, capacity, min_area, max_price, workspace_type, amenities
    )
    
    # Calculate matching scores if any matching criteria is provided
    # Or default sorting by match score if matching criteria is active
    is_matching_active = any([match_location, match_capacity, match_price, match_amenities, match_expectations])
    
    workspace_responses = []
    for w in workspaces:
        # Calculate match score
        score = 100.0
        if is_matching_active:
            score = calculate_match_score(
                w, match_location, match_capacity, match_price, match_amenities, match_expectations
            )
        
        # We inject the score into the dict and convert to schemas
        # Note: We can attach dynamic attributes directly to SQLAlchemy models for Pydantic to read if it is in schema,
        # but since match_score is not in the base DB model, let's create dynamic attribute.
        w.rating = score if is_matching_active else w.rating # For display, or we can just send it as rating. 
        # Actually, let's keep rating as it is, and we can return JSON or dynamically assign. Let's just override rating temporarily or attach it.
        # To avoid database side effects, we can return the objects.
        workspace_responses.append(w)
        
    if is_matching_active:
        # Sort workspaces by match score descending
        workspace_responses.sort(key=lambda x: x.rating, reverse=True)

    return workspace_responses

@router.get("/{workspace_id}", response_model=schemas.WorkspaceOut)
def get_space_by_id(workspace_id: int, db: Session = Depends(get_db)):
    workspace = crud.get_workspace_by_id(db, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    return workspace

@router.post("/", response_model=schemas.WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create_space(
    workspace: schemas.WorkspaceCreate,
    current_user = Depends(auth.RoleChecker(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    return crud.create_workspace(db, workspace, current_user.id)

@router.put("/{workspace_id}", response_model=schemas.WorkspaceOut)
def update_space(
    workspace_id: int,
    workspace: schemas.WorkspaceUpdate,
    current_user = Depends(auth.RoleChecker(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    db_workspace = crud.get_workspace_by_id(db, workspace_id)
    if not db_workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Ensure owner is updating their own workspace or user is admin
    if current_user.role != "admin" and db_workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this workspace"
        )
        
    return crud.update_workspace(db, workspace_id, workspace)

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(
    workspace_id: int,
    current_user = Depends(auth.RoleChecker(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    db_workspace = crud.get_workspace_by_id(db, workspace_id)
    if not db_workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
        
    if current_user.role != "admin" and db_workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this workspace"
        )
        
    crud.delete_workspace(db, workspace_id)
    return None
