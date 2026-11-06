from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import User, Role
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_active_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        role = db.query(Role).filter(Role.name == "farmer").first()

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role_id=role.id,
        preferred_state=user_in.preferred_state or "Punjab",
        preferred_mandi=user_in.preferred_mandi or "Khanna Mandi"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email, "role": role.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role.name,
        "user_id": new_user.id,
        "full_name": new_user.full_name
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": user.email, "role": user.role.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.name,
        "user_id": user.id,
        "full_name": user.full_name
    }

@router.post("/login-json", response_model=Token)
def login_json(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token({"sub": user.email, "role": user.role.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.name,
        "user_id": user.id,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.name if current_user.role else "farmer",
        "preferred_state": current_user.preferred_state,
        "preferred_mandi": current_user.preferred_mandi,
        "created_at": current_user.created_at
    }

@router.put("/me", response_model=UserOut)
def update_profile(
    updates: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if "full_name" in updates:
        current_user.full_name = updates["full_name"]
    if "preferred_state" in updates:
        current_user.preferred_state = updates["preferred_state"]
    if "preferred_mandi" in updates:
        current_user.preferred_mandi = updates["preferred_mandi"]
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.name if current_user.role else "farmer",
        "preferred_state": current_user.preferred_state,
        "preferred_mandi": current_user.preferred_mandi,
        "created_at": current_user.created_at
    }
