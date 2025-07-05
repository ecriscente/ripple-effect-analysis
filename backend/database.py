
import sqlite3
from passlib.context import CryptContext

DATABASE_URL = "zeitgeist.db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    conn = sqlite3.connect(DATABASE_URL)
    return conn

def create_user_table():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            hashed_password TEXT NOT NULL
        )
        '''
    )
    conn.commit()
    conn.close()

def create_user(email, password):
    conn = get_db()
    cursor = conn.cursor()
    hashed_password = pwd_context.hash(password)
    try:
        cursor.execute(
            "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
            (email, hashed_password),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        return None  # User already exists
    finally:
        conn.close()
    return get_user(email)

def get_user(email):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

if __name__ == "__main__":
    create_user_table()
