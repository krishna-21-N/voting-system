from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_conn
from ..schemas import ElectionUpdate
from ..deps import get_current_admin
from ..auth_utils import iso

router = APIRouter(prefix="/api/election", tags=["election"])


def compute_status(start, end, now):
    if not start or not end:
        return "not_configured"
    if now < start:
        return "not_started"
    if now <= end:
        return "open"
    return "closed"


def parse_dt(value: str) -> datetime:
    # <input type="datetime-local"> omits seconds ("YYYY-MM-DDTHH:MM");
    # pad them in so fromisoformat works on every supported Python version.
    if len(value) == 16:
        value += ":00"
    return datetime.fromisoformat(value)


@router.get("")
def get_election():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT title, start_time, end_time FROM election_settings WHERE id = 1")
            row = cur.fetchone()
        now = datetime.now()
        status = compute_status(row["start_time"], row["end_time"], now)
        return {
            "title": row["title"],
            "start_time": iso(row["start_time"]),
            "end_time": iso(row["end_time"]),
            "server_time": iso(now),
            "status": status,
        }
    finally:
        conn.close()


@router.put("")
def update_election(payload: ElectionUpdate, admin=Depends(get_current_admin)):
    start = parse_dt(payload.start_time)
    end = parse_dt(payload.end_time)
    if end <= start:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE election_settings SET title=%s, start_time=%s, end_time=%s WHERE id=1",
                (payload.title, start, end),
            )
        conn.commit()
        return {"message": "Election schedule updated"}
    finally:
        conn.close()
