"""
Database engine and session factory — synchronous SQLite.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from typing import Generator

from app.config import settings

if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG,
    )
else:
    # Use standard create_engine for PostgreSQL and other DBs
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
    )

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a database session, auto-closes on finish."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

