-- Create 5 pre-configured user accounts
-- Run this script in Supabase SQL Editor
-- Note: You'll need to set passwords manually in Supabase Auth dashboard
-- OR use the Supabase Admin API to create users with passwords

-- Method 1: Using Supabase Dashboard (Recommended)
-- Go to Authentication > Users > Add User
-- Create users with these credentials:

/*
ACCOUNT 1 - ADMIN
Email: admin@khayyamautos.com
Password: Admin@2024!
Role: admin
Full Name: System Administrator

ACCOUNT 2 - OWNER
Email: owner@khayyamautos.com
Password: Owner@2024!
Role: owner
Full Name: Business Owner

ACCOUNT 3 - STAFF
Email: staff1@khayyamautos.com
Password: Staff@2024!
Role: staff
Full Name: Staff Member 1

ACCOUNT 4 - STAFF
Email: staff2@khayyamautos.com
Password: Staff@2024!
Role: staff
Full Name: Staff Member 2

ACCOUNT 5 - STAFF
Email: staff3@khayyamautos.com
Password: Staff@2024!
Role: staff
Full Name: Staff Member 3
*/

-- Method 2: Using SQL (requires service_role key - run via API or Supabase CLI)
-- This creates users in auth.users and automatically creates profiles via trigger

-- Note: To create users with passwords via SQL, you need to use Supabase Admin API
-- or create them manually in the Supabase Dashboard > Authentication > Users

-- After creating users in Supabase Dashboard, their profiles will be automatically
-- created by the trigger function (handle_new_user) defined in 001_initial_schema.sql

-- To update roles after user creation, run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@khayyamautos.com';
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'owner@khayyamautos.com';
-- UPDATE public.profiles SET role = 'staff' WHERE email = 'staff1@khayyamautos.com';
-- UPDATE public.profiles SET role = 'staff' WHERE email = 'staff2@khayyamautos.com';
-- UPDATE public.profiles SET role = 'staff' WHERE email = 'staff3@khayyamautos.com';

