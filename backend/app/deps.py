from fastapi import Header, HTTPException
from jose import JWTError
from .auth_utils import decode_token


def _extract_token(authorization: str) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")
    parts = authorization.split(" ")
    return parts[1] if len(parts) == 2 else parts[0]


def get_current_voter(authorization: str = Header(default=None)):
    token = _extract_token(authorization)
    try:
        return decode_token(token)
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid or expired session. Please log in again.")


def get_current_admin(authorization: str = Header(default=None)):
    token = _extract_token(authorization)
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid or expired session. Please log in again.")
    if not payload.get("isAdmin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload
