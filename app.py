from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routes.dashboard import router as dashboard_router
from routes.tv import router as tv_router

app = FastAPI(title="MoonTV")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(dashboard_router)
app.include_router(tv_router)
