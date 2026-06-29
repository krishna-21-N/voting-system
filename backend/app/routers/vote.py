from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from ..database import get_conn
from ..schemas import VoteCast
from ..deps import get_current_voter

router = APIRouter(prefix="/api/vote", tags=["vote"])

STATUS_MESSAGES = {
    "not_configured": "Voting has not been set up yet. Check back later.",
    "not_started": "Voting has not started yet.",
    "closed": "Voting has closed. Check the results page.",
}


def _election_status(cur, now: datetime) -> str:
    cur.execute("SELECT start_time, end_time FROM election_settings WHERE id = 1")
    row = cur.fetchone()
    if not row["start_time"] or not row["end_time"]:
        return "not_configured"
    if now < row["start_time"]:
        return "not_started"
    if now <= row["end_time"]:
        return "open"
    return "closed"


@router.post("")
def cast_vote(payload: VoteCast, voter=Depends(get_current_voter)):
    """The vote row stores ONLY candidate_id + timestamp — no voter_id at all,
    so the choice can never be traced back to a person. The voter row only
    ever records THAT they voted, inside a row-locked transaction so a
    double-click can't double-count."""
    voter_id = voter["id"]
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            status = _election_status(cur, datetime.now())
            if status != "open":
                raise HTTPException(status_code=403, detail=STATUS_MESSAGES.get(status, "Voting is not open."))

            cur.execute("SELECT has_voted FROM voters WHERE id = %s FOR UPDATE", (voter_id,))
            voter_row = cur.fetchone()
            if not voter_row:
                raise HTTPException(status_code=404, detail="Voter not found")
            if voter_row["has_voted"]:
                raise HTTPException(status_code=409, detail="You have already voted")

            cur.execute("SELECT id FROM candidates WHERE id = %s", (payload.candidate_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Candidate not found")

            cur.execute("INSERT INTO votes (candidate_id) VALUES (%s)", (payload.candidate_id,))
            cur.execute("UPDATE candidates SET vote_count = vote_count + 1 WHERE id = %s", (payload.candidate_id,))
            cur.execute("UPDATE voters SET has_voted = TRUE WHERE id = %s", (voter_id,))

        conn.commit()
        return {"message": "Vote cast successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Server error while casting vote")
    finally:
        conn.close()


@router.get("/status")
def vote_status(voter=Depends(get_current_voter)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT has_voted FROM voters WHERE id = %s", (voter["id"],))
            row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Voter not found")
        return {"has_voted": bool(row["has_voted"])}
    finally:
        conn.close()
