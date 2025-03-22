-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  display_name TEXT,
  first_name TEXT,
  phone_number TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'leader', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_views INTEGER DEFAULT 0
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Leaders can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_insert_access" ON users;
DROP POLICY IF EXISTS "enable_update_access" ON users;

-- Create simple non-recursive policies
CREATE POLICY "enable_all_authenticated_read"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_self_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_self_update"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Add comment to explain table purpose
COMMENT ON TABLE public.users IS 'Profile data for each user.'; 