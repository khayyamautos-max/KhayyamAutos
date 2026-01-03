-- Add the required companies for POS filtering
-- Run this in Supabase SQL Editor

INSERT INTO public.companies (name, description) VALUES 
('SGA', 'SGA Company'),
('ISH', 'ISH Company'),
('Crown', 'Crown Company'),
('Atlas Honda', 'Atlas Honda Motorcycles'),
('Future', 'Future Company'),
('NSA', 'NSA Company'),
('China', 'China Import'),
('Local', 'Local Manufacturer')
ON CONFLICT DO NOTHING;

-- Verify companies were added
SELECT name FROM public.companies ORDER BY name;

