import sqlite3
import json
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

def create_analysis_table():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            technology TEXT NOT NULL,
            primary_ripples_title TEXT NOT NULL,
            primary_ripples_points TEXT NOT NULL,
            secondary_ripples_title TEXT NOT NULL,
            secondary_ripples_points TEXT NOT NULL,
            synthesis_title TEXT NOT NULL,
            synthesis_points TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        '''
    )
    conn.commit()
    conn.close()

def get_analyses_by_user_id(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, technology, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    analyses = cursor.fetchall()
    conn.close()
    return analyses

def get_analysis_by_id(analysis_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, technology, primary_ripples_title, primary_ripples_points, secondary_ripples_title, secondary_ripples_points, synthesis_title, synthesis_points, created_at FROM analyses WHERE id = ?",
        (analysis_id,)
    )
    analysis_row = cursor.fetchone()
    conn.close()

    if not analysis_row:
        return None

    # Reconstruct the nested dictionary structure
    return {
        "user_id": analysis_row[0],
        "technology": analysis_row[1],
        "primary_ripples": {
            "title": analysis_row[2],
            "points": json.loads(analysis_row[3])
        },
        "secondary_ripples": {
            "title": analysis_row[4],
            "points": json.loads(analysis_row[5])
        },
        "synthesis": {
            "title": analysis_row[6],
            "points": json.loads(analysis_row[7])
        },
        "created_at": analysis_row[8]
    }

def save_analysis(user_id, technology, analysis_data):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO analyses (
                user_id, technology,
                primary_ripples_title, primary_ripples_points,
                secondary_ripples_title, secondary_ripples_points,
                synthesis_title, synthesis_points
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                technology,
                analysis_data['primary_ripples']['title'],
                json.dumps(analysis_data['primary_ripples']['points']),
                analysis_data['secondary_ripples']['title'],
                json.dumps(analysis_data['secondary_ripples']['points']),
                analysis_data['synthesis']['title'],
                json.dumps(analysis_data['synthesis']['points']),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Database error: {e}")
        return None
    finally:
        conn.close()

if __name__ == "__main__":
    create_user_table()
    create_analysis_table()