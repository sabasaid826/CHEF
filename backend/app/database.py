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
    url = settings.DATABASE_URL
    # Ensure we use pg8000 driver for PostgreSQL to avoid C-extension build errors
    if url.startswith("postgres://") or url.startswith("postgresql://"):
        url = url.replace("postgres://", "postgresql+pg8000://")
        url = url.replace("postgresql://", "postgresql+pg8000://")
        
        # pg8000 doesn't support sslmode in the URL, remove it
        if "?sslmode=require" in url:
            url = url.replace("?sslmode=require", "")
            
        import ssl
        ssl_context = ssl.create_default_context()
        engine = create_engine(url, echo=settings.DEBUG, connect_args={"ssl_context": ssl_context})
    else:
        engine = create_engine(url, echo=settings.DEBUG)

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

