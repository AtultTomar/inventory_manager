import logging
from threading import Lock

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings


settings = get_settings()
logger = logging.getLogger(__name__)

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()
_db_init_lock = Lock()
_db_initialized = False


def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
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
