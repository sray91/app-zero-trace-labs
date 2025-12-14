-- Create checkout_sessions table for tracking mobile checkout sessions
-- This is optional - the API endpoint works without it

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  user_id UUID,
  email TEXT NOT NULL,
  full_name TEXT,
  source TEXT DEFAULT 'unknown',
  status TEXT DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_session_id ON checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_email ON checkout_sessions(email);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);

-- Add RLS policies (optional - service role bypasses these anyway)
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API operations)
CREATE POLICY "Service role has full access to checkout_sessions" ON checkout_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE checkout_sessions IS 'Tracks checkout sessions created from the mobile app';
