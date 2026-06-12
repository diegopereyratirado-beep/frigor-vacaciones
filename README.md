# 🥩 FRIGOR S.A. — Control de Vacaciones

Sistema web de gestión vacacional para planta fija. **#CarneEsFRIGOR**

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite (puerto 5173) |
| Backend | FastAPI + SQLAlchemy (puerto 8000) |
| Base de datos | PostgreSQL 16 portable (puerto 5433) |

## Regla de negocio

**Días acumulados = meses completos desde la fecha de ingreso × 1.25** (planta fija).
Saldo disponible = acumulados − usados. Los días de domingo no cuentan en las solicitudes.

## Estructura de base de datos

- **users** — credenciales y rol (`admin` / `empleado`), vínculo opcional a `employees`
- **employees** — nombre, apellido, área, fecha_ingreso, dias_usados, tipo_contrato, activo
- **vacation_requests** — fechas, días solicitados, motivo, estado (`pendiente`/`aprobada`/`rechazada`), comentario de RR.HH.
- **notifications** — avisos por usuario (solicitud nueva, aprobación, rechazo)

## Modo producción (siempre encendida) 🟢

La app corre **en modo producción permanente** para que RR.HH. acceda desde cualquier dispositivo de la red:

- **URL para los dispositivos**: <http://192.168.33.195:8000>
- `serve.ps1` es el supervisor: mantiene PostgreSQL y la web vivos, y los relanza si se caen (log en `servidor.log`).
- Se auto-arranca al iniciar sesión en este equipo (acceso directo en la carpeta Inicio: `FRIGOR-Vacaciones.cmd`).
- Regla de firewall "FRIGOR Vacaciones 8000" permite el acceso entrante.
- La suspensión con corriente está desactivada; **el equipo debe quedar encendido y con sesión iniciada**.
- El backend sirve el frontend compilado (`frontend/dist`); tras cambiar código del frontend, recompilar con `npm run build`.

> Si la IP del equipo cambia (DHCP), la URL cambia con ella. Conviene fijar IP estática o reservarla en el router.

## Arranque rápido (desarrollo)

```powershell
.\start.ps1
```

Eso levanta PostgreSQL portable, el backend (con seed automático la primera vez) y el frontend con recarga en caliente.
Luego abre <http://localhost:5173>.

### Manual

```powershell
# 1. PostgreSQL portable (primera vez: initdb; ver start.ps1)
# 2. Backend
cd backend
.\venv\Scripts\python.exe -m app.seed       # datos de prueba (solo primera vez)
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm run dev
```

## Credenciales de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin RR.HH. | `admin` | `admin123` |
| Empleado (ej.) | `carlosmendoza` | `1234` |

Los 10 empleados seed usan usuario `nombre+apellido` (sin tildes ni espacios) y contraseña `1234`:
carlosmendoza, mariagutierrez, jorgevillarroel, anacamacho, luisfernandez,
patriciarojas, robertosuarez, danielavargas, fernandoquispe, gabrielamontano.

## Importación desde Excel

Archivo `.xlsx` con columnas: **Nombre**, **Área**, **FechaIngreso** (AAAA-MM-DD), **DíasUsados**.
Hay un ejemplo en `ejemplo_importacion.xlsx`. Al importar se generan usuario y contraseña inicial (`1234`) por cada fila.
