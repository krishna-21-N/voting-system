import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from ..database import get_conn
from ..deps import get_current_admin

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE = 4 * 1024 * 1024  # 4MB


@router.get("")
def list_candidates():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, department, slogan, photo_path FROM candidates ORDER BY id")
            return cur.fetchall()
    finally:
        conn.close()


@router.get("/results")
def results():
    """Candidate name, department, photo, and vote count only — this query never
    touches the voters table for identity, only for a turnout count."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, department, photo_path, vote_count FROM candidates ORDER BY vote_count DESC"
            )
            candidates = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS total_votes FROM votes")
            total_votes = cur.fetchone()["total_votes"]
            cur.execute("SELECT COUNT(*) AS total_voters FROM voters")
            total_voters = cur.fetchone()["total_voters"]
        return {"candidates": candidates, "total_votes": total_votes, "total_voters": total_voters}
    finally:
        conn.close()


@router.post("", status_code=201)
def add_candidate(
    name: str = Form(...),
    department: Optional[str] = Form(""),
    slogan: Optional[str] = Form(""),
    photo: Optional[UploadFile] = File(None),
    admin=Depends(get_current_admin),
):
    photo_path = None
    if photo and photo.filename:
        ext = os.path.splitext(photo.filename)[1].lower()
        if ext not in ALLOWED_EXT:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images are allowed")

        contents = photo.file.read()
        if len(contents) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Photo must be 4MB or smaller")

        filename = f"{uuid.uuid4().hex}{ext}"
        with open(UPLOAD_DIR / filename, "wb") as f:
            f.write(contents)
        photo_path = f"/uploads/{filename}"

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO candidates (name, department, slogan, photo_path) VALUES (%s,%s,%s,%s)",
                (name, department or "", slogan or "", photo_path),
            )
        conn.commit()
        return {"message": "Candidate added"}
    finally:
        conn.close()


@router.delete("/{candidate_id}")
def remove_candidate(candidate_id: int, admin=Depends(get_current_admin)):
    conn = get_conn()
    candidate = None
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT photo_path FROM candidates WHERE id=%s", (candidate_id,))
            candidate = cur.fetchone()
            cur.execute("DELETE FROM candidates WHERE id=%s", (candidate_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Could not remove candidate (it may already have votes)")
    finally:
        conn.close()

    if candidate and candidate.get("photo_path"):
        try:
            (UPLOAD_DIR / Path(candidate["photo_path"]).name).unlink(missing_ok=True)
        except OSError:
            pass

    return {"message": "Candidate removed"}
