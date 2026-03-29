from fastapi import FastAPI

from App.core.config import settings
from App.api_routes.health import router as health_router
from App.api_routes.clients import router as clients_router
from App.api_routes.auth import router as auth_router
from App.api_routes.users import router as users_router
from App.api_routes.roles import router as roles_router
from App.api_routes.installations import router as installations_router
from App.api_routes.device_types import router as device_types_router
from App.api_routes.devices import router as devices_router
from App.api_routes.installation_devices import router as installation_devices_router
from App.api_routes.plants import router as plants_router
from App.api_routes.device_readings import router as device_readings_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
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
app.include_router(device_readings_router)


@app.get("/")
def root():
    return {
        "message": "Plant API V2 is running",
        "version": settings.APP_VERSION,
    }
