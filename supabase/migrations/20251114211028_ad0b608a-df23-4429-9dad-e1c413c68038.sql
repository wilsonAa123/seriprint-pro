-- Eliminar la política problemática que causa el error
DROP POLICY IF EXISTS "Users can view their own quotes by email" ON public.quotes;

-- Crear una política más simple y segura para que cualquier usuario autenticado pueda ver cotizaciones
-- (Los usuarios con rol staff ya tienen acceso con "Authenticated users can view all quotes")
CREATE POLICY "Staff can view all quotes" 
ON public.quotes 
FOR SELECT 
USING (is_staff(auth.uid()));

-- Asegurar que cualquiera pueda crear cotizaciones (clientes públicos)
-- Esta política ya existe pero la recreamos para asegurar que esté correcta
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
CREATE POLICY "Anyone can create quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (true);