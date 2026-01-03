-- Set roles for pre-created users
-- Run this AFTER creating users in Supabase Dashboard > Authentication > Users

-- Set admin role
UPDATE public.profiles 
SET role = 'admin', full_name = 'System Administrator'
WHERE email = 'admin@khayyamautos.com';

-- Set owner role
UPDATE public.profiles 
SET role = 'owner', full_name = 'Business Owner'
WHERE email = 'owner@khayyamautos.com';

-- Set staff roles
UPDATE public.profiles 
SET role = 'staff', full_name = 'Staff Member 1'
WHERE email = 'staff1@khayyamautos.com';

UPDATE public.profiles 
SET role = 'staff', full_name = 'Staff Member 2'
WHERE email = 'staff2@khayyamautos.com';

UPDATE public.profiles 
SET role = 'staff', full_name = 'Staff Member 3'
WHERE email = 'staff3@khayyamautos.com';

-- Verify roles were set correctly
SELECT email, full_name, role FROM public.profiles ORDER BY role, email;

