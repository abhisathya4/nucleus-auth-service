# 🛠️ Nucleus Database Setup

This guide walks you through setting up the PostgreSQL database required for the Nucleus platform.

---

## 📦 Prerequisites

- PostgreSQL 14+
- Access to a superuser (or an account with privileges to create databases, users, and schemas)

---

## 🧱 Setup Steps

### 1. Create the Database

Create the main database. In production, this is usually named `nucleus_db`. You may use a different name for development:

```sql
CREATE DATABASE nucleus_db;
```

---

### 2. Create Primary Owner User

Create the `nucleus_owner` user and grant full ownership of the database:

```sql
CREATE USER nucleus_owner WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nucleus_db TO nucleus_owner;
ALTER DATABASE nucleus_db OWNER TO nucleus_owner;
```

---

### 3. Create the Authenticated Role

Create a user (or role) for authenticated connections, which your application will use:

```sql
CREATE USER authenticated WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nucleus_db TO authenticated;
```

> ⚠️ It's good practice to restrict `authenticated` to a specific schema or set of permissions in production—adjust as necessary.

---

### 4. Create the `auth` Schema and Functions

Run the following commands inside the `nucleus_db` database:

```sql
-- Switch to nucleus_db
\c nucleus_db

-- Create auth schema and functions
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION nucleus_owner;

-- Function: Set user ID in session
CREATE OR REPLACE FUNCTION auth.set_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('auth.user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user ID from session
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('auth.user_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Clear user ID from session
CREATE OR REPLACE FUNCTION auth.init()
RETURNS void AS $$
BEGIN
  PERFORM set_config('auth.user_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 5. Grant Execution Permissions

Grant function execution privileges for both `auth` and `public` schemas to both roles:

```sql
-- Grant EXECUTE on all current and future functions in the auth schema
GRANT USAGE ON SCHEMA auth TO nucleus_owner, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO nucleus_owner, authenticated;

-- Grant same for public schema if needed
GRANT USAGE ON SCHEMA public TO nucleus_owner, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO nucleus_owner, authenticated;
```

> 📝 If you later create more functions in these schemas, you may need to re-run the `GRANT EXECUTE` command unless using `ALTER DEFAULT PRIVILEGES`.

---

## ✅ Done!

Your PostgreSQL database is now ready for use by the Nucleus backend. Ensure your application environment is configured with the right credentials and connection strings.
