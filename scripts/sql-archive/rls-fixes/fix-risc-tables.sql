-- Quick fix script for RISC tables if you encountered the admin_emails error
-- Run this if you got an error about admin_emails not existing

-- First, create the admin_emails table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin emails
INSERT INTO admin_emails (email) VALUES 
  ('antoccic@fitchburg.k12.ma.us'),
  ('craigantocci@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Now you can run the full create_risc_tables.sql migration without errors
