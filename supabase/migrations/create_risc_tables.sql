-- Create tables for Google RISC (Cross-Account Protection) support
-- https://developers.google.com/identity/protocols/risc

-- Create admin_emails table first (needed for RLS policies)
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin emails (update with your actual admin emails)
INSERT INTO admin_emails (email) VALUES 
  ('antoccic@fitchburg.k12.ma.us'),
  ('craigantocci@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Table to store security events received from Google
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_identifier TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for security_events table
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events (user_identifier);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_processed ON security_events (processed_at DESC);

-- Table to track user security status based on RISC events
CREATE TABLE IF NOT EXISTS user_security_status (
  email TEXT PRIMARY KEY,
  requires_reauth BOOLEAN DEFAULT FALSE,
  requires_mfa BOOLEAN DEFAULT FALSE,
  account_suspended BOOLEAN DEFAULT FALSE,
  account_deleted BOOLEAN DEFAULT FALSE,
  reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store user OAuth tokens (for cleanup when revoked)
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_type TEXT NOT NULL, -- 'access' or 'refresh'
  encrypted_token TEXT NOT NULL, -- Encrypted for security
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate tokens
  UNIQUE(email, token_type)
);

-- Index for token cleanup
CREATE INDEX IF NOT EXISTS idx_user_tokens_email ON user_tokens (email);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_events (admin only)
CREATE POLICY "Admin users can view security events"
  ON security_events
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails
    )
  );

CREATE POLICY "System can insert security events"
  ON security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_security_status
CREATE POLICY "Users can view their own security status"
  ON user_security_status
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt() ->> 'email'
    OR
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails
    )
  );

CREATE POLICY "System can update security status"
  ON user_security_status
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails
    )
  );

-- RLS Policies for user_tokens
CREATE POLICY "Users can view their own tokens"
  ON user_tokens
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt() ->> 'email'
    OR
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails
    )
  );

CREATE POLICY "System can manage tokens"
  ON user_tokens
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_emails
    )
  );

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM user_tokens
  WHERE expires_at < NOW();
END;
$$;

-- Create a scheduled job to clean up expired tokens (if pg_cron is available)
-- Uncomment if you have pg_cron extension enabled
-- SELECT cron.schedule(
--   'cleanup-expired-tokens',
--   '0 2 * * *', -- Run daily at 2 AM
--   'SELECT cleanup_expired_tokens();'
-- );

-- Function to check if a user requires re-authentication
CREATE OR REPLACE FUNCTION check_user_security_status(user_email TEXT)
RETURNS TABLE(
  requires_reauth BOOLEAN,
  requires_mfa BOOLEAN,
  account_suspended BOOLEAN,
  account_deleted BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uss.requires_reauth,
    uss.requires_mfa,
    uss.account_suspended,
    uss.account_deleted,
    uss.reason
  FROM user_security_status uss
  WHERE uss.email = user_email;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_security_status TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE security_events IS 'Stores security events received from Google RISC';
COMMENT ON TABLE user_security_status IS 'Tracks user security status based on RISC events';
COMMENT ON TABLE user_tokens IS 'Stores encrypted user tokens for management';
COMMENT ON FUNCTION check_user_security_status IS 'Checks if a user requires re-authentication or has security restrictions';
COMMENT ON FUNCTION cleanup_expired_tokens IS 'Removes expired tokens from storage';
