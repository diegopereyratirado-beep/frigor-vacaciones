from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _login(db: Session, username: str, password: str) -> schemas.TokenResponse:
    user = (
        db.query(models.User)
        .filter(models.User.username == username.strip().lower())
        .first()
    )
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    return schemas.TokenResponse(
        access_token=create_access_token(user),
        role=user.role.value,
        username=user.username,
        employee_id=user.employee_id,
        nombre_completo=user.employee.nombre_completo if user.employee else "RR.HH. FRIGOR",
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login_json(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    return _login(db, data.username, data.password)


@router.post("/token", response_model=schemas.TokenResponse)
def login_form(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    return _login(db, form.username, form.password)


@router.post("/change-password")
def change_password(
    data: dict,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    actual = data.get("actual", "")
    nueva = data.get("nueva", "")
    if not verify_password(actual, user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no coincide")
    if len(nueva) < 4:
        raise HTTPException(status_code=400, detail="La nueva contraseña es muy corta")
    user.password_hash = hash_password(nueva)
    db.commit()
    return {"ok": True, "mensaje": "Contraseña actualizada"}
