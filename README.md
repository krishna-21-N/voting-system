# Secure Voting System

A simple online voting system for small groups — an office, a college class, a club.

- Voters log in with a Company ID + Company Email (no signup needed — admin adds them first)
- Each person can vote only once
- Voting only works during a time window set by the admin
- Votes are anonymous — there's no way to know who voted for whom
- Admin can add candidates (with photos), set the voting time, and manage the voter list

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Login:** JWT (JSON Web Tokens)
- **Photo uploads:** Multer

## Project Structure
```
voting-system/
├── backend/        → server code (API, database connection, routes)
└── frontend/        → website pages (login, vote, results, admin)
```

## How to Run It

**1. Set up the database**
```bash
mysql -u root -p < backend/sql/schema.sql
```

**2. Set up the backend**
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and add your MySQL password + a random secret key.

**3. Create the admin login**
```bash
npm run seed-admin
```
This creates: username `admin`, password `admin123` (change it later).

**4. Start the server**
```bash
npm start
```
Now open `http://localhost:5000` in your browser.

## Pages
| Page | What it's for |
|---|---|
| `/` | Voter login |
| `/vote.html` | Cast your vote |
| `/results.html` | See live results |
| `/admin.html` | Admin login + manage everything |

## Main API Routes
| Route | What it does |
|---|---|
| `POST /api/auth/login` | Voter login |
| `POST /api/vote` | Cast a vote |
| `GET /api/candidates/results` | Get vote counts |
| `POST /api/candidates` | (Admin) Add a candidate |
| `POST /api/voters` | (Admin) Add a voter |
| `PUT /api/election` | (Admin) Set voting time |

## Why It's Safe
- A vote is only ever saved as "candidate + time" — never linked to a voter, so no one can trace a vote back to a person.
- Double-voting is blocked at the database level, not just in the browser.
- Voting outside the set time window is blocked by the server, not just hidden buttons.

## License
MIT — free to use and modify.