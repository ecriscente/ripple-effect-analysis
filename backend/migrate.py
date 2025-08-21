"""
Database Migration System for Ripple Effect Analysis Platform

Automatically runs SQL migration scripts on startup or deployment.
Tracks which migrations have been applied to prevent duplicate runs.
"""

import os
import psycopg
import logging
from pathlib import Path
from typing import List, Tuple
from database import DATABASE_URL

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self, db_url: str, migrations_dir: str = "migrations"):
        self.db_url = db_url
        self.migrations_dir = Path(migrations_dir)
        
    def get_migration_files(self) -> List[Path]:
        """Get all SQL migration files sorted by filename"""
        if not self.migrations_dir.exists():
            logger.warning(f"Migrations directory {self.migrations_dir} does not exist")
            return []
            
        sql_files = list(self.migrations_dir.glob("*.sql"))
        return sorted(sql_files)
    
    def get_applied_migrations(self) -> List[str]:
        """Get list of already applied migrations"""
        try:
            with psycopg.connect(self.db_url) as conn:
                with conn.cursor() as cursor:
                    # Create migrations table if it doesn't exist
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS schema_migrations (
                            version VARCHAR(255) PRIMARY KEY,
                            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    conn.commit()
                    
                    # Get applied migrations
                    cursor.execute("SELECT version FROM schema_migrations ORDER BY version")
                    return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error checking applied migrations: {e}")
            return []
    
    def apply_migration(self, migration_file: Path) -> bool:
        """Apply a single migration file"""
        migration_name = migration_file.stem  # filename without extension
        
        try:
            # Read migration file
            with open(migration_file, 'r') as f:
                sql_content = f.read()
            
            logger.info(f"Applying migration: {migration_name}")
            
            with psycopg.connect(self.db_url) as conn:
                with conn.cursor() as cursor:
                    # Execute the migration SQL
                    cursor.execute(sql_content)
                    conn.commit()
                    
            logger.info(f"✅ Successfully applied migration: {migration_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error applying migration {migration_name}: {e}")
            return False
    
    def run_migrations(self) -> Tuple[int, int]:
        """
        Run all pending migrations
        
        Returns:
            (applied_count, total_count) tuple
        """
        migration_files = self.get_migration_files()
        applied_migrations = self.get_applied_migrations()
        
        if not migration_files:
            logger.info("No migration files found")
            return 0, 0
        
        logger.info(f"Found {len(migration_files)} migration files")
        logger.info(f"Already applied: {len(applied_migrations)} migrations")
        
        applied_count = 0
        
        for migration_file in migration_files:
            migration_name = migration_file.stem
            
            if migration_name in applied_migrations:
                logger.info(f"⏭️  Skipping already applied migration: {migration_name}")
                continue
            
            if self.apply_migration(migration_file):
                applied_count += 1
            else:
                logger.error(f"Migration failed: {migration_name}")
                break  # Stop on first failure
        
        logger.info(f"Migration complete: {applied_count}/{len(migration_files)} new migrations applied")
        return applied_count, len(migration_files)
    
    def check_database_connection(self) -> bool:
        """Test database connection"""
        try:
            with psycopg.connect(self.db_url) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    return result[0] == 1
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False

def run_migrations():
    """Main function to run database migrations"""
    logger.info("🚀 Starting database migration process...")
    
    migrator = DatabaseMigrator(DATABASE_URL)
    
    # Test connection first
    if not migrator.check_database_connection():
        logger.error("❌ Cannot connect to database. Migration aborted.")
        return False
    
    logger.info("✅ Database connection successful")
    
    try:
        applied, total = migrator.run_migrations()
        
        if applied == 0:
            logger.info("✅ Database is up to date. No migrations needed.")
        else:
            logger.info(f"✅ Database migration completed successfully. Applied {applied} new migrations.")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration process failed: {e}")
        return False

if __name__ == "__main__":
    # Run migrations when script is executed directly
    success = run_migrations()
    exit(0 if success else 1)