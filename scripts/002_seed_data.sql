-- seed_data.sql
-- Seed initial companies
INSERT INTO public.companies (name, description) VALUES 
('Shimano', 'Global leader in bicycle components'),
('SRAM', 'Innovative drivetrain and brake systems'),
('Campagnolo', 'Premium Italian bicycle parts');

-- Seed initial inventory
-- Note: Replace company_ids with actual UUIDs if needed, or use a query
INSERT INTO public.inventory (part_number, name, category, cost_price, selling_price, quantity_in_stock, company_id)
SELECT 'SH-105-RD', 'Shimano 105 Rear Derailleur', 'Drivetrain', 45.00, 75.00, 20, id FROM public.companies WHERE name = 'Shimano' LIMIT 1;

INSERT INTO public.inventory (part_number, name, category, cost_price, selling_price, quantity_in_stock, company_id)
SELECT 'SR-GX-CH', 'SRAM GX Eagle Chain', 'Drivetrain', 25.00, 45.00, 50, id FROM public.companies WHERE name = 'SRAM' LIMIT 1;
