# Supabase Migrations

This directory contains SQL migration files that need to be applied to your Supabase project.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended for hosted projects)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of the migration file (e.g., `add_intensity_value.sql`)
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have the Supabase CLI installed and linked to your project:

```bash
# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

### Option 3: Direct SQL execution via psql

If you have direct database access:

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f supabase/migrations/add_intensity_value.sql
```

## Migration Files

| File | Description | Date |
|------|-------------|------|
| `add_intensity_value.sql` | Adds `intensity_value` (INTEGER, nullable) column to `habit_logs` table | 2024 |

## Notes

- The `intensity_value` column is nullable — single-action habits store NULL
- The existing unique constraint `(user_id, habit_id, date)` is not affected
- This migration uses `IF NOT EXISTS` so it's safe to run multiple times
- No data migration is needed — existing rows will have NULL for `intensity_value`
