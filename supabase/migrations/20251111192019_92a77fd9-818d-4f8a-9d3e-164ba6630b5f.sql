-- Función para sincronizar emails de auth.users a profiles
CREATE OR REPLACE FUNCTION public.sync_user_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET email = au.email
  FROM auth.users au
  WHERE p.id = au.id
  AND (p.email IS NULL OR p.email = '');
END;
$$;

-- Ejecutar la sincronización para usuarios existentes
SELECT public.sync_user_emails();

-- Actualizar el trigger para asegurar que siempre se guarde el email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'cliente',
    NEW.email
  );
  RETURN NEW;
END;
$$;