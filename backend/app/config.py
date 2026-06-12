import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:frigor2026@localhost:5433/frigor_vacaciones",
)
# Los proveedores cloud (Neon, Render) entregan la URL como postgres://...
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
SECRET_KEY = os.getenv("SECRET_KEY", "frigor-dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Tasa de acumulación para planta fija: 1.25 días por mes trabajado
DIAS_POR_MES = 1.25

AREAS = [
    "Gerencia",
    "Logística",
    "RR.HH.",
    "Producción",
    "Administración",
    "Calidad",
    "Ventas",
]
