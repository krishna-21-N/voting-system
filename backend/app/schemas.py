from pydantic import BaseModel, EmailStr


class VoterLogin(BaseModel):
    company_id: str
    company_email: EmailStr


class AdminLogin(BaseModel):
    username: str
    password: str


class ElectionUpdate(BaseModel):
    title: str
    start_time: str  # comes from <input type="datetime-local">, e.g. "2026-07-01T09:00"
    end_time: str


class VoterCreate(BaseModel):
    full_name: str
    company_id: str
    company_email: EmailStr


class VoteCast(BaseModel):
    candidate_id: int
