import os
import json
import psycopg
from psycopg import errors
from psycopg_pool import ConnectionPool
from passlib.context import CryptContext
from datetime import datetime, timezone
from urllib.parse import quote_plus
from dotenv import load_dotenv
import time
import logging

# Load environment variables
load_dotenv()

# Database connection details from environment variables
DB_NAME = os.getenv("POSTGRES_DB", "zeitgeist_db")
DB_USER = os.getenv("POSTGRES_USER", "user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")

# URL encode password to handle special characters
DB_PASSWORD_ENCODED = quote_plus(DB_PASSWORD)

# Connection string
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD_ENCODED}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Connection pool
connection_pool = None

def init_db_pool():
    global connection_pool
    if connection_pool is None:
        connection_pool = ConnectionPool(
            DATABASE_URL,
            min_size=1,
            max_size=10,
            timeout=30,
            max_idle=300
        )
    return connection_pool

def get_db():
    max_retries = 3
    retry_delay = 1
    
    if connection_pool is None:
        init_db_pool()
    
    for attempt in range(max_retries):
        try:
            return connection_pool.getconn()
        except Exception as e:
            logging.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                raise

def return_db_connection(conn):
    if connection_pool and conn:
        try:
            connection_pool.putconn(conn)
        except Exception as e:
            logging.error(f"Error returning connection to pool: {e}")

def create_user_table():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    hashed_password TEXT NOT NULL,
                    terms_agreed BOOLEAN DEFAULT FALSE,
                    terms_agreed_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
                '''
            )
            # Add columns to existing table if they don't exist
            cursor.execute(
                '''
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                '''
            )
        conn.commit()
    finally:
        return_db_connection(conn)

def create_user(email, password, terms_agreed=False):
    hashed_password = pwd_context.hash(password)
    terms_agreed_at = datetime.now(timezone.utc) if terms_agreed else None
    
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            try:
                cursor.execute(
                    """INSERT INTO users (email, hashed_password, terms_agreed, terms_agreed_at) 
                       VALUES (%s, %s, %s, %s) RETURNING id, email""",
                    (email, hashed_password, terms_agreed, terms_agreed_at),
                )
                new_user = cursor.fetchone()
                conn.commit()
                return new_user
            except errors.UniqueViolation:
                conn.rollback()
                return None  # User already exists
    finally:
        return_db_connection(conn)

def get_user(email):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, email, hashed_password FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            return user
    finally:
        return_db_connection(conn)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_analysis_table():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS analyses (
                    id SERIAL PRIMARY KEY,
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
    finally:
        return_db_connection(conn)

def get_analyses_by_user_id(user_id):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, technology, created_at FROM analyses WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            analyses = cursor.fetchall()
            return analyses
    finally:
        return_db_connection(conn)

def get_analysis_by_id(analysis_id):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, technology, primary_ripples_title, primary_ripples_points, secondary_ripples_title, secondary_ripples_points, synthesis_title, synthesis_points, created_at FROM analyses WHERE id = %s",
                (analysis_id,)
            )
            analysis_row = cursor.fetchone()

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
    finally:
        return_db_connection(conn)

def save_analysis(user_id, technology, analysis_data):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO analyses (
                        user_id, technology,
                        primary_ripples_title, primary_ripples_points,
                        secondary_ripples_title, secondary_ripples_points,
                        synthesis_title, synthesis_points
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
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
                analysis_id = cursor.fetchone()[0]
                conn.commit()
                return analysis_id
            except Exception as e:
                print(f"Database error: {e}")
                conn.rollback()
                return None
    finally:
        return_db_connection(conn)

def create_password_reset_table():
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                '''
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    token TEXT NOT NULL UNIQUE,
                    expires_at TIMESTAMP NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
                '''
            )
        conn.commit()
    finally:
        return_db_connection(conn)

def create_password_reset_token(user_id, token, expires_at):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            try:
                cursor.execute(
                    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s) RETURNING id",
                    (user_id, token, expires_at),
                )
                new_token_id = cursor.fetchone()[0]
                conn.commit()
                return new_token_id
            except Exception as e:
                conn.rollback()
                return None
    finally:
        return_db_connection(conn)

def get_user_by_reset_token(token):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT u.id, u.email, u.hashed_password, prt.expires_at FROM users u "
                "JOIN password_reset_tokens prt ON u.id = prt.user_id "
                "WHERE prt.token = %s",
                (token,)
            )
            user_data = cursor.fetchone()
            if user_data:
                expires_at = user_data[3]
                if expires_at.tzinfo is None:
                    # Make expires_at timezone-aware (UTC)
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > datetime.now(timezone.utc):
                    return user_data[:-1] # Return user data without expiry
            return None
    finally:
        return_db_connection(conn)


def delete_password_reset_token(token):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM password_reset_tokens WHERE token = %s", (token,))
            conn.commit()
    finally:
        return_db_connection(conn)

def update_user_password(user_id, new_password):
    hashed_password = pwd_context.hash(new_password)
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET hashed_password = %s WHERE id = %s",
                (hashed_password, user_id)
            )
            conn.commit()
    finally:
        return_db_connection(conn)


if __name__ == "__main__":
    # This block will now attempt to connect to PostgreSQL
    # Ensure your PostgreSQL server is running (e.g., via docker-compose up)
    try:
        create_user_table()
        create_analysis_table()
        create_password_reset_table()
        print("PostgreSQL tables created successfully (if they didn't exist).")
    except Exception as e:
        print(f"Error creating PostgreSQL tables: {e}")
