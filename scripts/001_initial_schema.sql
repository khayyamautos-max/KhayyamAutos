-- initial_schema.sql
-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.inventory;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.profiles;

-- 1. Profiles (extending auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  debt_balance DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Inventory (Parts)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  category TEXT,
  cost_price DECIMAL(12, 2) NOT NULL,
  selling_price DECIMAL(12, 2) NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Transactions (POS & History)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed', -- 'completed', 'pending_debt'
  items JSONB NOT NULL, -- Array of {part_id, name, quantity, price}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: Users can view all profiles but only update their own
CREATE POLICY "Allow authenticated users to view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Companies: Viewable by all authenticated, manageable by admin/owner
CREATE POLICY "Allow authenticated users to view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage companies" ON public.companies FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Customers: Viewable and manageable by all authenticated staff
CREATE POLICY "Allow authenticated staff to manage customers" ON public.customers FOR ALL TO authenticated USING (true);

-- Inventory: Viewable by all, manageable by admin/owner
CREATE POLICY "Allow authenticated users to view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage inventory" ON public.inventory FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')));

-- Transactions: Viewable by all, manageable by staff
CREATE POLICY "Allow authenticated users to manage transactions" ON public.transactions FOR ALL TO authenticated USING (true);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'staff'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
