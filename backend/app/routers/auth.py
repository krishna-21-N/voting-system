from fastapi import APIRouter, HTTPException
from ..database import get_conn
from ..schemas import VoterLogin, AdminLogin
from ..auth_utils import create_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def voter_login(payload: VoterLogin):
    """Voter login — no password. A voter is already on the pre-loaded roster
    (added by the admin), so logging in just proves you're who the roster says:
    company ID + company email must both match the same record."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, has_voted FROM voters WHERE company_id = %s AND company_email = %s",
                (payload.company_id.strip(), str(payload.company_email).strip().lower()),
            )
            voter = cur.fetchone()
        if not voter:
            raise HTTPException(
                status_code=401,
                detail="No match found for that ID and email. Check your details or contact the election admin.",
            )
        token = create_token({"id": voter["id"]})
        return {"token": token, "has_voted": bool(voter["has_voted"])}
    finally:
        conn.close()


@router.post("/admin/login")
def admin_login(payload: AdminLogin):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM admins WHERE username = %s", (payload.username,))
            admin = cur.fetchone()
        if not admin or not verify_password(payload.password, admin["password"]):
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        token = create_token({"id": admin["id"], "username": admin["username"], "isAdmin": True})
        return {"token": token, "username": admin["username"]}
    finally:
        conn.close()
