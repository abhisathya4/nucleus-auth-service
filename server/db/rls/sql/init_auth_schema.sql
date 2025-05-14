-- Create an authentication schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Set the current user ID (stored in session config)
CREATE OR REPLACE FUNCTION auth.set_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  -- Store user_id as a session-local setting (overwrites for this connection)
  PERFORM set_config('auth.user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get the current user ID
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('auth.user_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Optional: reset the user ID (clears auth session state)
CREATE OR REPLACE FUNCTION auth.init()
RETURNS void AS $$
BEGIN
  -- This removes the setting for this session
  PERFORM set_config('auth.user_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;