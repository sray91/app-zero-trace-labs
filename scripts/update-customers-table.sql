-- Update customers table to ensure all necessary columns exist
-- Run this in your Supabase SQL Editor

-- Add whop_user_id column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whop_user_id TEXT;

-- Add user_id column if it doesn't exist (links to auth.users)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add full_name column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add plan_name column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS plan_name TEXT;

-- Add subscription_status column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Add has_app_access column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_app_access BOOLEAN DEFAULT false;

-- Add timestamps if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_whop_user_id ON customers(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_status ON customers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_customers_has_app_access ON customers(has_app_access);

-- Create or replace the update trigger
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at_trigger ON customers;
CREATE TRIGGER update_customers_updated_at_trigger
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Verify the schema
SELECT 'customers table schema:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
