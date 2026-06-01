import logging
from threading import Lock

from fastapi import HTTPException, status
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings


settings = get_settings()
logger = logging.getLogger(__name__)

engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()
_db_init_lock = Lock()
_db_initialized = False


def get_db():
    if not init_db():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Check the Railway DATABASE_URL variable on the backend service.",
        )

    try:
        db = SessionLocal()
    except SQLAlchemyError as exc:
        logger.exception("Database session failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Check the Railway DATABASE_URL variable on the backend service.",
        ) from exc

    try:
        yield db
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Check the Railway DATABASE_URL variable on the backend service.",
        ) from exc
    finally:
        db.close()


def init_db() -> bool:
    global _db_initialized

    if _db_initialized:
        return True

    from app import models  # noqa: F401

    try:
        with _db_init_lock:
            if _db_initialized:
                return True
            Base.metadata.create_all(bind=engine)
            _db_initialized = True
            return True
    except SQLAlchemyError as exc:
        logger.warning("Database initialization skipped: %s", exc)
        return False


def check_db() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError as exc:
        logger.warning("Database health check failed: %s", exc)
        return False
