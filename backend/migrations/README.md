# Database Migrations

This directory contains SQL migration scripts for the Ripple Effect Analysis Platform database.

## How It Works

1. **Automatic Execution**: Migrations run automatically when the application starts
2. **Tracking**: Applied migrations are tracked in the `schema_migrations` table
3. **Idempotent**: Safe to run multiple times - already applied migrations are skipped
4. **Ordered**: Migrations are applied in filename order (001, 002, 003, etc.)

## Migration Files

- `001_initial_schema.sql` - Initial database schema with all core tables

## Creating New Migrations

1. Create a new `.sql` file with incrementing number: `002_add_feature.sql`
2. Use descriptive names: `003_add_user_preferences.sql`
3. Include both DDL and DML statements as needed
4. Always use `IF NOT EXISTS` for table creation
5. Add appropriate indexes for performance

Example migration file structure:
```sql
-- Description of changes
-- Migration: 002_add_feature
-- Created: YYYY-MM-DD

-- Add new table
CREATE TABLE IF NOT EXISTS new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns here
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_column ON new_table(column);

-- Insert migration record (important!)
INSERT INTO schema_migrations (version) VALUES ('002_add_feature') 
ON CONFLICT (version) DO NOTHING;
```

## Manual Migration Execution

To run migrations manually:
```bash
python migrate.py
```

## Deployment

On Render, migrations run automatically via:
1. `build.sh` script during deployment
2. Application startup (`main.py`)

This ensures your database is always up-to-date with your code deployment.