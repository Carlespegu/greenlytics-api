from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from App.api_routes.dashboard import router as dashboard_router
from App.api_routes.alerts import router as alerts_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# 👇 CORS AQUÍ (abans de routers)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://greenlytics-web.vercel.app/login",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 routers DESPRÉS
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
app.include_router(alerts_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {
        "message": "Plant API V2 is running",
        "version": settings.APP_VERSION,
    }