-- Update the generate_quote_number function to properly bypass RLS
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  current_year TEXT;
  sequence_num INTEGER;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Use a direct query that bypasses RLS since this is SECURITY DEFINER
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 'COT-' || current_year || '-([0-9]+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.quotes
  WHERE quote_number LIKE 'COT-' || current_year || '%';
  
  new_number := 'COT-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;