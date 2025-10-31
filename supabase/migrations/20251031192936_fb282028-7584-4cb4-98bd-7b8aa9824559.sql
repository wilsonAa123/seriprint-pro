-- Add price column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

-- Add comment to explain the column
COMMENT ON COLUMN public.products.price IS 'Base price for the product in local currency';