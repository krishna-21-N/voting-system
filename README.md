 # 🗳️ Secure Voting System

A full-stack voting app — built with **Python/FastAPI** (backend), **HTML/CSS/JavaScript** (frontend), and **MySQL** (database).

## Features

* Voter login with company ID + email (no signup, admin pre-loads the roster)
* Admin can add candidates (with photo), set voting start/end time, and manage voters
* One vote per person — enforced using MySQL transactions with row-level locking
* Fully anonymous votes — no voter information stored with the vote
* Live results page with vote counts and turnout percentage
* Interactive REST API documentation with FastAPI Swagger UI

## Tech Stack

**Backend:** Python, FastAPI, MySQL, PyMySQL, DBUtils, JWT, Pydantic

**Frontend:** HTML, CSS, JavaScript

## Project Structure

```text
voting-system/
├── backend/      # FastAPI, Python, MySQL
└── frontend/     # HTML, CSS, JavaScript
```

## Getting Started

### 1. Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/` (copy from `.env.example`) and add your MySQL details:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=voting_system
JWT_SECRET=your-secret-key
PORT=5000
```

Run the backend:

```bash
python seed_admin.py
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

Server runs at: `http://localhost:5000`

### 2. Database

```bash
mysql -u root -p < backend/sql/schema.sql
```

This creates the `voting_system` database and tables.

Then create the admin login:

```bash
cd backend
python seed_admin.py
```

## Usage

1. Open `http://localhost:5000/admin.html` → sign in (`admin` / `admin123`) → set the voting schedule, add candidates, and manage voters.
2. Open `http://localhost:5000` → voters sign in with Company ID and Company Email → cast their vote.
3. Open `http://localhost:5000/results.html` → view live election results.
4. Open `http://localhost:5000/docs` → browse the interactive API documentation.

## License

MIT — free to use for personal and learning purposes.
