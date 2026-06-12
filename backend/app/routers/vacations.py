from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import get_current_user, require_admin
from ..database import get_db

router = APIRouter(prefix="/api/vacations", tags=["vacations"])


def _dias_habiles(inicio, fin) -> float:
    """Cuenta días lunes-sábado entre las fechas (régimen boliviano: sábado cuenta)."""
    from datetime import timedelta

    if fin < inicio:
        return 0
    dias = 0
    actual = inicio
    while actual <= fin:
        if actual.weekday() < 6:  # 0=lunes ... 5=sábado; domingo no cuenta
            dias += 1
        actual += timedelta(days=1)
    return float(dias)


def _request_out(req: models.VacationRequest) -> schemas.VacationRequestOut:
    return schemas.VacationRequestOut(
        id=req.id,
        employee_id=req.employee_id,
        empleado=req.employee.nombre_completo if req.employee else None,
        area=req.employee.area if req.employee else None,
        fecha_inicio=req.fecha_inicio,
        fecha_fin=req.fecha_fin,
        dias_solicitados=req.dias_solicitados,
        motivo=req.motivo,
        estado=req.estado.value,
        comentario_admin=req.comentario_admin,
        created_at=req.created_at,
        resolved_at=req.resolved_at,
    )


def _notify_admins(db: Session, mensaje: str, tipo: str = "solicitud"):
    admins = db.query(models.User).filter(models.User.role == models.Role.admin).all()
    for admin in admins:
        db.add(models.Notification(user_id=admin.id, mensaje=mensaje, tipo=tipo))


@router.post("", response_model=schemas.VacationRequestOut, status_code=201)
def create_request(
    data: schemas.VacationRequestCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.employee is None:
        raise HTTPException(status_code=400, detail="El usuario no tiene ficha de empleado")
    if data.fecha_fin < data.fecha_inicio:
        raise HTTPException(status_code=400, detail="La fecha fin debe ser posterior al inicio")

    dias = _dias_habiles(data.fecha_inicio, data.fecha_fin)
    if dias <= 0:
        raise HTTPException(status_code=400, detail="El rango no incluye días hábiles")

    emp = user.employee
    if dias > emp.saldo():
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente: solicitas {dias} días y tienes {emp.saldo()} disponibles",
        )

    req = models.VacationRequest(
        employee_id=emp.id,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        dias_solicitados=dias,
        motivo=data.motivo,
    )
    db.add(req)
    _notify_admins(
        db,
        f"📋 {emp.nombre_completo} ({emp.area}) solicitó {dias:g} días de vacaciones "
        f"del {data.fecha_inicio:%d/%m/%Y} al {data.fecha_fin:%d/%m/%Y}.",
    )
    db.commit()
    db.refresh(req)
    return _request_out(req)


@router.get("/mine", response_model=list[schemas.VacationRequestOut])
def my_requests(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.employee is None:
        return []
    reqs = (
        db.query(models.VacationRequest)
        .filter(models.VacationRequest.employee_id == user.employee.id)
        .order_by(models.VacationRequest.created_at.desc())
        .all()
    )
    return [_request_out(r) for r in reqs]


@router.get("", response_model=list[schemas.VacationRequestOut])
def all_requests(
    estado: str | None = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    query = db.query(models.VacationRequest)
    if estado:
        query = query.filter(models.VacationRequest.estado == estado)
    reqs = query.order_by(models.VacationRequest.created_at.desc()).all()
    return [_request_out(r) for r in reqs]


def _resolve(
    req_id: int,
    nuevo_estado: models.RequestStatus,
    comentario: str | None,
    db: Session,
) -> models.VacationRequest:
    req = db.get(models.VacationRequest, req_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.estado != models.RequestStatus.pendiente:
        raise HTTPException(status_code=400, detail="La solicitud ya fue resuelta")

    req.estado = nuevo_estado
    req.comentario_admin = comentario
    req.resolved_at = datetime.now(timezone.utc)

    emp = req.employee
    if nuevo_estado == models.RequestStatus.aprobada:
        emp.dias_usados = round(emp.dias_usados + req.dias_solicitados, 2)
        mensaje = (
            f"✅ Tu solicitud de {req.dias_solicitados:g} días "
            f"({req.fecha_inicio:%d/%m/%Y} – {req.fecha_fin:%d/%m/%Y}) fue APROBADA."
        )
        tipo = "aprobada"
    else:
        mensaje = (
            f"❌ Tu solicitud de {req.dias_solicitados:g} días "
            f"({req.fecha_inicio:%d/%m/%Y} – {req.fecha_fin:%d/%m/%Y}) fue RECHAZADA."
        )
        tipo = "rechazada"
    if comentario:
        mensaje += f" Comentario de RR.HH.: {comentario}"

    if emp.user:
        db.add(models.Notification(user_id=emp.user.id, mensaje=mensaje, tipo=tipo))

    db.commit()
    db.refresh(req)
    return req


@router.post("/{req_id}/approve", response_model=schemas.VacationRequestOut)
def approve(
    req_id: int,
    data: schemas.VacationRequestResolve,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return _request_out(_resolve(req_id, models.RequestStatus.aprobada, data.comentario, db))


@router.post("/{req_id}/reject", response_model=schemas.VacationRequestOut)
def reject(
    req_id: int,
    data: schemas.VacationRequestResolve,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    return _request_out(_resolve(req_id, models.RequestStatus.rechazada, data.comentario, db))
