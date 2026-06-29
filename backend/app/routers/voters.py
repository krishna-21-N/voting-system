from fastapi import APIRouter, Depends, HTTPException
from ..database import get_conn
from ..schemas import VoterCreate
from ..deps import get_current_admin

router = APIRouter(prefix="/api/voters", tags=["voters"])


@router.get("")
def list_voters(admin=Depends(get_current_admin)):
    """Shows who HAS voted (for turnout tracking) but there is no column or
    join anywhere that reveals WHAT they voted for — that link doesn't exist."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, full_name, company_id, company_email, has_voted FROM voters ORDER BY full_name"
            )
            return cur.fetchall()
    finally:
        conn.close()


@router.post("", status_code=201)
def add_voter(payload: VoterCreate, admin=Depends(get_current_admin)):
    company_id = payload.company_id.strip()
    company_email = str(payload.company_email).strip().lower()

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id FROM voters WHERE company_id = %s OR company_email = %s",
                (company_id, company_email),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="That company ID or email is already on the roster")

            cur.execute(
                "INSERT INTO voters (full_name, company_id, company_email) VALUES (%s,%s,%s)",
                (payload.full_name.strip(), company_id, company_email),
            )
        conn.commit()
        return {"message": "Voter added to roster"}
    finally:
        conn.close()


@router.delete("/{voter_id}")
def remove_voter(voter_id: int, admin=Depends(get_current_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM voters WHERE id=%s", (voter_id,))
        conn.commit()
        return {"message": "Voter removed from roster"}
    finally:
        conn.close()
