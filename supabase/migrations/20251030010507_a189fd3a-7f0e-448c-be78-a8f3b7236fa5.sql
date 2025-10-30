-- Fix security warnings by setting search_path on functions

-- Update generate_quote_number function with proper search_path
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TEXT 
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
  
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM quotes
  WHERE quote_number LIKE 'COT-' || current_year || '%';
  
  new_number := 'COT-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Update set_quote_number function with proper search_path
CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;