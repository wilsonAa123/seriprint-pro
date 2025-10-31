-- Add missing fields to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS delivery_time TEXT;

-- Add missing fields to quote_items table
ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS printing_technique TEXT,
ADD COLUMN IF NOT EXISTS number_of_colors INTEGER,
ADD COLUMN IF NOT EXISTS print_area_size TEXT,
ADD COLUMN IF NOT EXISTS base_cost NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS additional_costs NUMERIC(10,2) DEFAULT 0;

-- Create quote_attachments table for reference images/files
CREATE TABLE IF NOT EXISTS public.quote_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quote_attachments
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for quote_attachments
CREATE POLICY "Anyone can upload attachments"
ON public.quote_attachments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can view attachments"
ON public.quote_attachments
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete attachments"
ON public.quote_attachments
FOR DELETE
USING (auth.role() = 'authenticated');

-- Create storage bucket for quote attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-attachments', 'quote-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote-attachments bucket
CREATE POLICY "Anyone can upload quote attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'quote-attachments');

CREATE POLICY "Anyone can view quote attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'quote-attachments');

CREATE POLICY "Authenticated users can delete quote attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'quote-attachments' AND auth.role() = 'authenticated');