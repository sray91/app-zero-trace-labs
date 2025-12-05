-- Create user_profiles table to store user information and welcome flow status
-- Run this in your Supabase SQL Editor

-- Step 1: Add user_id to customers table to link with auth.users
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index on customers.user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Create index on customers.email for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Step 2: Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Personal information (for skip trace searches)
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Welcome flow tracking
  welcome_completed BOOLEAN DEFAULT FALSE,
  welcome_step INTEGER DEFAULT 0,

  -- Privacy and consent
  privacy_consent_given BOOLEAN DEFAULT FALSE,
  privacy_consent_date TIMESTAMPTZ,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_date TIMESTAMPTZ,

  -- Feature tour
  tour_completed BOOLEAN DEFAULT FALSE,

  -- Link to customer record (optional, if they came through Whop)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 3: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at on customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Check if there's a matching customer record by email
  SELECT * INTO customer_record
  FROM customers
  WHERE email = NEW.email
  LIMIT 1;

  -- Create user profile
  IF customer_record.id IS NOT NULL THEN
    -- Link to existing customer record
    INSERT INTO user_profiles (user_id, customer_id)
    VALUES (NEW.id, customer_record.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update customer record with user_id
    UPDATE customers
    SET user_id = NEW.id
    WHERE id = customer_record.id;
  ELSE
    -- No customer record, just create profile
    INSERT INTO user_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Step 5: Verify the tables were created/updated
SELECT 'customers columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers' AND column_name = 'user_id';

SELECT 'user_profiles columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
