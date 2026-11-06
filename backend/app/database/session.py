import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try PostgreSQL first, fallback to SQLite if needed
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    # Test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to PostgreSQL at %s", settings.DATABASE_URL)
except Exception as e:
    logger.warning("PostgreSQL connection failed (%s). Falling back to SQLite local database.", e)
    sqlite_url = "sqlite:///./agrimarket.db"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
