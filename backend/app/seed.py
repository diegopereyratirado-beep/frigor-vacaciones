"""Datos iniciales de prueba: usuario admin RR.HH. y 10 empleados de planta fija.

Ejecutar:  python -m app.seed
"""

from datetime import date

from . import models
from .auth import generate_username, hash_password
from .database import Base, SessionLocal, engine

EMPLEADOS = [
    # (nombre, apellido, área, fecha_ingreso, días_usados)
    ("Carlos", "Mendoza", "Gerencia", date(2018, 3, 15), 20),
    ("María", "Gutiérrez", "RR.HH.", date(2019, 7, 1), 12),
    ("Jorge", "Villarroel", "Producción", date(2020, 1, 20), 8),
    ("Ana", "Camacho", "Producción", date(2021, 5, 10), 5),
    ("Luis", "Fernández", "Logística", date(2019, 11, 4), 15),
    ("Patricia", "Rojas", "Administración", date(2022, 2, 14), 3),
    ("Roberto", "Suárez", "Calidad", date(2020, 9, 1), 10),
    ("Daniela", "Vargas", "Ventas", date(2021, 8, 23), 6),
    ("Fernando", "Quispe", "Logística", date(2023, 1, 9), 2),
    ("Gabriela", "Montaño", "Ventas", date(2022, 10, 3), 4),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).first():
            print("La base de datos ya tiene datos; seed omitido.")
            return

        admin = models.User(
            username="admin",
            password_hash=hash_password("admin123"),
            role=models.Role.admin,
        )
        db.add(admin)

        credenciales = []
        for nombre, apellido, area, ingreso, usados in EMPLEADOS:
            emp = models.Employee(
                nombre=nombre,
                apellido=apellido,
                area=area,
                fecha_ingreso=ingreso,
                dias_usados=float(usados),
            )
            db.add(emp)
            db.flush()
            username = generate_username(db, nombre, apellido)
            db.add(
                models.User(
                    username=username,
                    password_hash=hash_password("1234"),
                    role=models.Role.empleado,
                    employee_id=emp.id,
                )
            )
            credenciales.append((emp.nombre_completo, area, username))

        db.commit()
        print("Seed completado.")
        print(f"  Admin RR.HH. -> usuario: admin / contraseña: admin123")
        print(f"  {len(credenciales)} empleados (contraseña inicial: 1234):")
        for nombre, area, username in credenciales:
            print(f"    {nombre:<22} {area:<16} usuario: {username}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
