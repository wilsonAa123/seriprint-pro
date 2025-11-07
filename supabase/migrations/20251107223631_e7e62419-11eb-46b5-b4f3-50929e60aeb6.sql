-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that allow admins to view all profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow admins to view all profiles when querying
CREATE POLICY "Staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_staff(auth.uid()));