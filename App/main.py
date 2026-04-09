import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from App.api_routes.alerts import router as alerts_router
from App.api_routes.auth import router as auth_router
from App.api_routes.clients import router as clients_router
from App.api_routes.dashboard import router as dashboard_router
from App.api_routes.device_readings import router as device_readings_router
from App.api_routes.devices import router as devices_router
from App.api_routes.device_types import router as device_types_router
from App.api_routes.health import router as health_router
from App.api_routes.installation_devices import router as installation_devices_router
from App.api_routes.installations import router as installations_router
from App.api_routes.plants import router as plants_router
from App.api_routes.plant_thresholds import router as plant_thresholds_router
from App.api_routes.reading_types import router as reading_types_router
from App.api_routes.readings import router as readings_router
from App.api_routes.roles import router as roles_router
from App.api_routes.users import router as users_router
from App.core.config import settings
from App.services.alert_jobs_service import process_pending_alert_jobs
from database.base import Base
import database.models  # noqa: F401
from database.models.plant_threshold import PlantThreshold
from database.session import SessionLocal, engine

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://greenlytics-web.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(clients_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(installations_router)
app.include_router(device_types_router)
app.include_router(devices_router)
app.include_router(installation_devices_router)
app.include_router(plants_router)
app.include_router(plant_thresholds_router)
app.include_router(reading_types_router)
app.include_router(device_readings_router)
app.include_router(readings_router)
app.include_router(alerts_router)
app.include_router(dashboard_router)


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "message": "Plant API V2 is running",
        "version": settings.APP_VERSION,
    }


def _run_alert_jobs_batch():
    db = SessionLocal()
    try:
        return process_pending_alert_jobs(db)
    finally:
        db.close()


async def alert_worker():
    while True:
        try:
            await asyncio.to_thread(_run_alert_jobs_batch)
        except Exception as e:
            print("Error in alert worker:", e)

        await asyncio.sleep(60)


@app.on_event("startup")
async def startup_alert_worker():
    Base.metadata.create_all(bind=engine, tables=[PlantThreshold.__table__])
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE plants ALTER COLUMN installationid DROP NOT NULL"))
        connection.execute(text("ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_code_key"))
        connection.execute(text("ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_apikey_key"))
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_code_active_unique "
                "ON devices (code) WHERE isdeleted = false"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_apikey_active_unique "
                "ON devices (apikey) WHERE isdeleted = false AND apikey IS NOT NULL"
            )
        )
    asyncio.create_task(alert_worker())
