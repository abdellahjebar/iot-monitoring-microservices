from typing import Final
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import logging

# ENV Variables
USER_DB: Final[str] = os.getenv('USER_DB', 'admin')
PASSWORD_DB: Final[str] = os.getenv('PASSWORD_DB', '1234')
NAME_DB: Final[str] = os.getenv('NAME_DB', 'db_devices')
SERVER_DB: Final[str] = os.getenv('SERVER_DB', 'localhost')
PORT_DB: Final[str] = os.getenv('PORT_DB', '5432')
SECRET_KEY: Final[str] = os.getenv('SECRET_KEY', '$argon2id$v=19$m=65536,t=3,p=4$hT18aCPZ5AFxQ2ncYkRkWg$5UvBttA1brZmn6Bmf1T0NgKaYaqUzMV1pvWNxDp5pFc')

DATABASE_URL = f"postgresql+psycopg2://{USER_DB}:{PASSWORD_DB}@{SERVER_DB}:{PORT_DB}/{NAME_DB}"

# SQLAlchemy
engine = create_engine(DATABASE_URL, pool_size=10, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("device_management")
