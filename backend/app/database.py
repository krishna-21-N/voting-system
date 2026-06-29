import os
import pymysql
from dbutils.pooled_db import PooledDB
from dotenv import load_dotenv

load_dotenv()

# autocommit=False is deliberate: vote casting runs inside an explicit
# transaction with a row lock, the same way the Node/mysql2 version did.
_pool = PooledDB(
    creator=pymysql,
    host=os.getenv("DB_HOST", "localhost"),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", ""),
    database=os.getenv("DB_NAME", "voting_system"),
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=False,
    maxconnections=10,
    blocking=True,
)


def get_conn():
    """Get a pooled connection. Caller is responsible for commit/rollback/close."""
    return _pool.connection()
