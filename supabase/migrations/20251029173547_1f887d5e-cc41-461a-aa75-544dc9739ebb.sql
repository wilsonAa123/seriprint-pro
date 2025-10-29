-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'diseñador');

-- Create enum for product status
CREATE TYPE product_status AS ENUM ('publicado', 'borrador', 'archivado');

-- Create enum for stock status
CREATE TYPE stock_status AS ENUM ('en_stock', 'bajo_stock', 'a_pedido', 'sin_stock');

-- Create enum for quote status
CREATE TYPE quote_status AS ENUM ('pendiente', 'enviada', 'aceptada', 'rechazada', 'convertida');

-- User profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'vendedor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  status product_status DEFAULT 'borrador',
  stock_status stock_status DEFAULT 'a_pedido',
  internal_cost DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  technical_specs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images table
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants table (colors and sizes)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  sku_variant TEXT,
  stock_quantity INTEGER DEFAULT 0,
  additional_cost DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, color, size)
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  location TEXT,
  company TEXT,
  tax_id TEXT,
  customer_type TEXT DEFAULT 'nuevo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_location TEXT,
  status quote_status DEFAULT 'pendiente',
  notes TEXT,
  internal_notes TEXT,
  total_amount DECIMAL(10,2),
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote items table
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_color TEXT,
  variant_size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for products (public read for published, admin write)
CREATE POLICY "Anyone can view published products"
  ON products FOR SELECT
  USING (status = 'publicado');

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for product_images
CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage product images"
  ON product_images FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for product_variants
CREATE POLICY "Anyone can view available variants"
  ON product_variants FOR SELECT
  USING (is_available = true);

CREATE POLICY "Authenticated users can manage variants"
  ON product_variants FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for quotes
CREATE POLICY "Anyone can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all quotes"
  ON quotes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for quote_items
CREATE POLICY "Anyone can create quote items"
  ON quote_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view quote items"
  ON quote_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote number
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_number();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Insert some sample categories
INSERT INTO categories (name, description, slug, display_order) VALUES
  ('Poleras', 'Poleras y camisetas personalizadas', 'poleras', 1),
  ('Gorras', 'Gorras y sombreros personalizados', 'gorras', 2),
  ('Tazas', 'Tazas y vasos personalizados', 'tazas', 3),
  ('Bolsos', 'Bolsos y mochilas personalizadas', 'bolsos', 4);

-- Insert sample products
INSERT INTO products (name, description, sku, category_id, status, stock_status, internal_cost, stock_quantity) 
SELECT 
  'Polera Básica', 
  'Polera 100% algodón, ideal para serigrafía y sublimación. Disponible en múltiples colores y tallas.',
  'POL-BAS-001',
  id,
  'publicado',
  'en_stock',
  5000.00,
  100
FROM categories WHERE slug = 'poleras'
LIMIT 1;