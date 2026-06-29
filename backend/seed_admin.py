# Run once after setting up the database: python seed_admin.py
# Creates an admin login -> username: admin | password: admin123
from app.database import get_conn
from app.auth_utils import hash_password


def seed_admin():
    username = "admin"
    password = "admin123"

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM admins WHERE username = %s", (username,))
            if cur.fetchone():
                print('An admin named "admin" already exists — nothing to do.')
                return

            cur.execute(
                "INSERT INTO admins (username, password) VALUES (%s, %s)",
                (username, hash_password(password)),
            )
        conn.commit()
        print("Admin account created.")
        print("  username: admin")
        print("  password: admin123")
        print("Change this password before running a real election.")
    finally:
        conn.close()


if __name__ == "__main__":
    seed_admin()
