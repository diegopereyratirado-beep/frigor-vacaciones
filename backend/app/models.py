"""Estructura de base de datos del sistema de control vacacional FRIGOR S.A.

Tablas:
  - users:             credenciales y rol (admin RR.HH. / empleado)
  - employees:         datos laborales; el saldo se calcula como
                       meses_desde_ingreso * 1.25 - dias_usados (planta fija)
  - vacation_requests: solicitudes con flujo pendiente -> aprobada/rechazada
  - notifications:     avisos al usuario (aprobación, rechazo, nueva solicitud)
"""

import enum
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    admin = "admin"
    empleado = "empleado"


class RequestStatus(str, enum.Enum):
    pendiente = "pendiente"
    aprobada = "aprobada"
    rechazada = "rechazada"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.empleado)
    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    employee: Mapped["Employee | None"] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    apellido: Mapped[str] = mapped_column(String(120))
    area: Mapped[str] = mapped_column(String(80), index=True)
    fecha_ingreso: Mapped[date] = mapped_column(Date)
    dias_usados: Mapped[float] = mapped_column(Float, default=0.0)
    tipo_contrato: Mapped[str] = mapped_column(String(40), default="planta fija")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User | None"] = relationship(back_populates="employee", uselist=False)
    solicitudes: Mapped[list["VacationRequest"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellido}"

    def meses_trabajados(self, hasta: date | None = None) -> int:
        """Meses completos transcurridos desde la fecha de ingreso."""
        hasta = hasta or date.today()
        meses = (hasta.year - self.fecha_ingreso.year) * 12 + (
            hasta.month - self.fecha_ingreso.month
        )
        if hasta.day < self.fecha_ingreso.day:
            meses -= 1
        return max(meses, 0)

    def dias_acumulados(self) -> float:
        from .config import DIAS_POR_MES

        return round(self.meses_trabajados() * DIAS_POR_MES, 2)

    def saldo(self) -> float:
        return round(self.dias_acumulados() - self.dias_usados, 2)


class VacationRequest(Base):
    __tablename__ = "vacation_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    fecha_inicio: Mapped[date] = mapped_column(Date)
    fecha_fin: Mapped[date] = mapped_column(Date)
    dias_solicitados: Mapped[float] = mapped_column(Float)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus), default=RequestStatus.pendiente, index=True
    )
    comentario_admin: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    employee: Mapped["Employee"] = relationship(back_populates="solicitudes")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    mensaje: Mapped[str] = mapped_column(Text)
    tipo: Mapped[str] = mapped_column(String(40), default="info")  # info|aprobada|rechazada|solicitud
    leida: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="notifications")
