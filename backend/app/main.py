from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import auth, election, candidates, voters, vote

app = FastAPI(title="Secure Voting System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes must be included BEFORE the static mounts below, so that
# /api/* and /uploads/* are matched first and only leftover paths
# (the actual frontend pages) fall through to the static file server.
app.include_router(auth.router)
app.include_router(election.router)
app.include_router(candidates.router)
app.include_router(voters.router)
app.include_router(vote.router)

APP_DIR = Path(__file__).resolve().parent          # backend/app
BACKEND_DIR = APP_DIR.parent                       # backend
PROJECT_ROOT = BACKEND_DIR.parent                  # voting-system
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app.mount("/uploads", StaticFiles(directory=BACKEND_DIR / "uploads"), name="uploads")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
