from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import auth_routes, employees, notifications, vacations

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FRIGOR S.A. — Control de Vacaciones",
    description="Sistema de gestión vacacional. #CarneEsFRIGOR",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(employees.router)
app.include_router(vacations.router)
app.include_router(notifications.router)


@app.on_event("startup")
def auto_seed():
    """En despliegues nuevos (cloud) carga el admin y los datos de prueba una sola vez."""
    from . import seed

    try:
        seed.run()
    except Exception as exc:
        print(f"Seed automático omitido: {exc}")


@app.get("/api/health")
def health():
    return {"status": "ok", "empresa": "FRIGOR S.A.", "lema": "#CarneEsFRIGOR"}


# --- Frontend compilado (modo producción: un solo servidor para web + API) ---
DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        candidate = DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
