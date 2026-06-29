import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_token(data: dict, expires_minutes: int = 240) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Raises jose.JWTError on an invalid or expired token — callers turn that into a 403."""
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])


def iso(dt):
    """Serialize a naive datetime the same way the rest of the app expects: no
    timezone suffix, seconds truncated, so the browser's Date() parses it as
    local time — consistent with how the admin enters times via <input type=datetime-local>."""
    if dt is None:
        return None
    return dt.replace(microsecond=0).isoformat()
