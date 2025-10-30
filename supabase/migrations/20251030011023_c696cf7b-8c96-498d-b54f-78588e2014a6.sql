-- Add 'cliente' role to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cliente';

-- Update the trigger to create users as 'cliente' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'cliente'  -- Default role is now 'cliente' with no admin access
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to check if user has staff role (admin, vendedor, diseñador)
CREATE OR REPLACE FUNCTION public.is_staff(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'vendedor', 'diseñador')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policy: Only admins can update other users' roles
CREATE POLICY "Only admins can update roles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id OR 
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    -- If changing role, must be admin
    (CASE WHEN role IS DISTINCT FROM (SELECT role FROM profiles WHERE id = profiles.id LIMIT 1)
      THEN public.is_admin(auth.uid())
      ELSE true
    END)
  );

-- Drop old update policy if exists
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;