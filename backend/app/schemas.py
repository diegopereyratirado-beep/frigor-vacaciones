from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    employee_id: int | None = None
    nombre_completo: str | None = None


# ---------- Empleados ----------
class EmployeeBase(BaseModel):
    nombre: str
    apellido: str
    area: str
    fecha_ingreso: date
    dias_usados: float = 0.0
    tipo_contrato: str = "planta fija"


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    area: str | None = None
    fecha_ingreso: date | None = None
    dias_usados: float | None = None
    activo: bool | None = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
    username: str | None = None
    meses_trabajados: int = 0
    dias_acumulados: float = 0.0
    saldo: float = 0.0
    solicitudes_pendientes: int = 0


class EmployeeCreated(BaseModel):
    employee: EmployeeOut
    username: str
    password_inicial: str


class ImportResult(BaseModel):
    importados: int
    errores: list[str]
    credenciales: list[dict]


# ---------- Solicitudes ----------
class VacationRequestCreate(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    motivo: str | None = Field(default=None, max_length=500)


class VacationRequestResolve(BaseModel):
    comentario: str | None = Field(default=None, max_length=500)


class VacationRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    empleado: str | None = None
    area: str | None = None
    fecha_inicio: date
    fecha_fin: date
    dias_solicitados: float
    motivo: str | None
    estado: str
    comentario_admin: str | None
    created_at: datetime
    resolved_at: datetime | None


# ---------- Notificaciones ----------
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mensaje: str
    tipo: str
    leida: bool
    created_at: datetime


# ---------- Dashboard ----------
class EmployeeDashboard(BaseModel):
    nombre_completo: str
    area: str
    fecha_ingreso: date
    meses_trabajados: int
    dias_acumulados: float
    dias_usados: float
    saldo: float
