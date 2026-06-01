from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import check_db, init_db
from app.routers import customers, orders, products


settings = get_settings()
static_dir = Path(__file__).resolve().parent.parent / "static"
index_file = static_dir / "index.html"
assets_dir = static_dir / "assets"
config_file = static_dir / "config.js"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/")
def root():
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Inventory Order API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/db-health")
def db_health_check():
    if check_db():
        return {"status": "healthy"}
    return {
        "status": "unavailable",
        "detail": "Check the Railway DATABASE_URL variable on the backend service.",
    }


@app.get("/config.js", include_in_schema=False)
def frontend_config():
    if config_file.exists():
        return FileResponse(config_file, media_type="application/javascript")
    return {"VITE_API_BASE_URL": "/api"}


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    requested_file = static_dir / full_path
    if requested_file.is_file():
        return FileResponse(requested_file)
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Inventory Order API is running", "docs": "/docs"}
