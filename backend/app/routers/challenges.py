from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    status,
)

from sqlalchemy.orm import Session

from typing import List, Optional

from app.database import get_db

from app.models.challenge import (
    Challenge,
    Enrollment,
)

from app.models.user import User

from app.schemas.challenge import (
    ChallengeResponse,
    EnrollmentResponse,
    ChallengeCreate,
)

from app.schemas.workspace import (
    AdvanceStageRequest,
    AdvanceStageResponse,
    CanvasStateUpdate,
    EnrolledChallengeItem,
    EnrolledChallengesResponse,
    EvaluationStateUpdate,
    StepCompleteRequest,
    WorkspaceSaveResponse,
    WorkspaceState,
)

from app.services.storage_service import storage_service

from app.services.recommendation_service import (
    get_recommended_challenges,
)

from app.services import workspace_service

from app.security import get_current_user

from app.services.challenge_service import (
    challenge_service,
)


router = APIRouter(
    prefix="/api/challenges",
    tags=["challenges"],
)


# =========================================================
# GET ALL CHALLENGES
# =========================================================

@router.get(
    "",
    response_model=List[ChallengeResponse],
)
def get_challenges(
    domain: Optional[str] = Query(
        None,
        description="Filter by domain",
    ),
    difficulty: Optional[str] = Query(
        None,
        description="Filter by difficulty",
    ),
    tier: Optional[str] = Query(
        None,
        description="Filter by learning tier",
    ),
    search: Optional[str] = Query(
        None,
        description="Search challenges",
    ),
    db: Session = Depends(get_db),
):

    query = db.query(Challenge)

    # Domain
    if domain and domain.lower() != "all":

        query = query.filter(
            Challenge.domain.ilike(
                f"%{domain}%"
            )
        )

    # Difficulty
    if difficulty:

        query = query.filter(
            Challenge.difficulty == difficulty
        )

    # Learning tier
    if tier:

        query = query.filter(
            Challenge.learning_tier == tier
        )

    # Search
    if search:

        search_term = f"%{search}%"

        query = query.filter(
            Challenge.title.ilike(search_term)
            |
            Challenge.description.ilike(search_term)
            |
            Challenge.problem.ilike(search_term)
        )

    return (
        query
        .order_by(Challenge.id.desc())
        .all()
    )


# =========================================================
# RECOMMENDED CHALLENGES
# =========================================================

@router.get(
    "/recommended",
    response_model=List[ChallengeResponse],
)
def get_recommended_challenge_feed(
    limit: int = Query(
        10,
        ge=1,
        le=50,
    ),
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    return get_recommended_challenges(
        db=db,
        user=current_user,
        limit=limit,
    )


# =========================================================
# ENROLLED CHALLENGES
# =========================================================

@router.get(
    "/enrolled",
    response_model=EnrolledChallengesResponse,
)
def get_enrolled_challenges(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    items = [
        EnrolledChallengeItem(**item)

        for item in workspace_service.list_enrolled(
            db,
            current_user.id,
        )
    ]

    return EnrolledChallengesResponse(
        items=items
    )


# =========================================================
# TEST FILE UPLOAD
# =========================================================

@router.post("/test-upload")
def test_file_upload(
    file: UploadFile = File(...)
):

    url = storage_service.upload_file(file)

    return {
        "status": "success",
        "file_url": url,
    }


# =========================================================
# CREATE CHALLENGE
# =========================================================

@router.post(
    "",
    response_model=ChallengeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_challenge(
    challenge_in: ChallengeCreate,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    return challenge_service.create(
        db=db,
        data=challenge_in,
        user_id=current_user.id,
    )


# =========================================================
# GET SINGLE CHALLENGE
# =========================================================

@router.get(
    "/{id}",
    response_model=ChallengeResponse,
)
def get_challenge_detail(
    id: int,
    db: Session = Depends(get_db),
):

    challenge = (
        db.query(Challenge)
        .filter(
            Challenge.id == id
        )
        .first()
    )

    if not challenge:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    return challenge


# =========================================================
# ENROLL
# =========================================================

@router.post(
    "/{id}/enroll",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_in_challenge(
    id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    challenge = (
        db.query(Challenge)
        .filter(
            Challenge.id == id
        )
        .first()
    )

    if not challenge:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.challenge_id == id,
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this challenge",
        )

    enrollment = Enrollment(
        user_id=current_user.id,
        challenge_id=id,
        status="active",
        current_stage="canvas",
    )

    db.add(enrollment)

    db.commit()

    db.refresh(enrollment)

    return enrollment


# =========================================================
# WORKSPACE
# =========================================================

@router.get(
    "/{id}/workspace",
    response_model=WorkspaceState,
)
def get_workspace(
    id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    try:

        return workspace_service.get_workspace_data(
            db,
            current_user.id,
            id,
        )

    except workspace_service.WorkspaceNotFoundError as exc:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


# =========================================================
# CANVAS
# =========================================================

@router.patch(
    "/{id}/workspace/canvas",
    response_model=WorkspaceSaveResponse,
)
async def save_canvas_workspace(
    id: int,
    payload: CanvasStateUpdate,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    try:

        enrollment, rewards = (
            await workspace_service.save_canvas_state(
                db,
                current_user.id,
                id,
                payload.canvas_state,
                payload.mark_step_complete,
            )
        )

    except workspace_service.WorkspaceNotFoundError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except workspace_service.InvalidStepError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except (
        workspace_service.WorkspaceLockedError,
        workspace_service.LevelIncompleteError,
    ) as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    return WorkspaceSaveResponse(
        current_stage=enrollment.current_stage,
        completed_steps=enrollment.completed_steps or [],
        xp_awarded=rewards.xp_awarded,
        total_xp=rewards.total_xp,
    )


# =========================================================
# EVALUATION
# =========================================================

@router.patch(
    "/{id}/workspace/evaluation",
    response_model=WorkspaceSaveResponse,
)
async def save_evaluation_workspace(
    id: int,
    payload: EvaluationStateUpdate,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    try:

        enrollment, rewards = (
            await workspace_service.save_evaluation_state(
                db,
                current_user.id,
                id,
                payload.evaluation_state,
                payload.mark_step_complete,
            )
        )

    except workspace_service.WorkspaceNotFoundError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except workspace_service.InvalidStepError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except (
        workspace_service.WorkspaceLockedError,
        workspace_service.LevelIncompleteError,
    ) as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    return WorkspaceSaveResponse(
        current_stage=enrollment.current_stage,
        completed_steps=enrollment.completed_steps or [],
        xp_awarded=rewards.xp_awarded,
        total_xp=rewards.total_xp,
    )


# =========================================================
# COMPLETE STEP
# =========================================================

@router.post(
    "/{id}/workspace/complete-step",
    response_model=WorkspaceSaveResponse,
)
async def complete_workspace_step(
    id: int,
    payload: StepCompleteRequest,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    try:

        enrollment, rewards = (
            await workspace_service.complete_step(
                db,
                current_user.id,
                id,
                payload.step_key,
            )
        )

    except workspace_service.WorkspaceNotFoundError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except workspace_service.InvalidStepError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except (
        workspace_service.WorkspaceLockedError,
        workspace_service.LevelIncompleteError,
    ) as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    return WorkspaceSaveResponse(
        current_stage=enrollment.current_stage,
        completed_steps=enrollment.completed_steps or [],
        xp_awarded=rewards.xp_awarded,
        total_xp=rewards.total_xp,
    )


# =========================================================
# ADVANCE STAGE
# =========================================================

@router.post(
    "/{id}/workspace/advance-stage",
    response_model=AdvanceStageResponse,
)
async def advance_workspace_stage(
    id: int,

    payload: Optional[
        AdvanceStageRequest
    ] = None,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db),
):

    try:

        enrollment, rewards = (
            await workspace_service.advance_stage(
                db,
                current_user.id,
                id,
                from_stage=(
                    payload.stage
                    if payload
                    else None
                ),
            )
        )

    except workspace_service.WorkspaceNotFoundError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except (
        workspace_service.WorkspaceLockedError,
        workspace_service.LevelIncompleteError,
    ) as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    return AdvanceStageResponse(
        current_stage=enrollment.current_stage,
        xp_awarded=rewards.xp_awarded,
        total_xp=rewards.total_xp,
        cleared_level=rewards.cleared_level,
    )