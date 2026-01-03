# Pre-Configured User Accounts

## 📋 Account Credentials

### Account 1 - Administrator
- **Email:** `admin@khayyamautos.com`
- **Password:** `Admin@2024!`
- **Role:** `admin`
- **Full Name:** System Administrator
- **Permissions:** Full access - can manage inventory, companies, and create users

### Account 2 - Owner
- **Email:** `owner@khayyamautos.com`
- **Password:** `Owner@2024!`
- **Role:** `owner`
- **Full Name:** Business Owner
- **Permissions:** Full access - can manage inventory, companies, and create users

### Account 3 - Staff Member 1
- **Email:** `staff1@khayyamautos.com`
- **Password:** `Staff@2024!`
- **Role:** `staff`
- **Full Name:** Staff Member 1
- **Permissions:** Can manage customers, transactions, view inventory

### Account 4 - Staff Member 2
- **Email:** `staff2@khayyamautos.com`
- **Password:** `Staff@2024!`
- **Role:** `staff`
- **Full Name:** Staff Member 2
- **Permissions:** Can manage customers, transactions, view inventory

### Account 5 - Staff Member 3
- **Email:** `staff3@khayyamautos.com`
- **Password:** `Staff@2024!`
- **Role:** `staff`
- **Full Name:** Staff Member 3
- **Permissions:** Can manage customers, transactions, view inventory

---

## 🔐 How to Create These Accounts

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. For each account:
   - Enter the email
   - Enter the password
   - Click **Create User**
5. After creating all users, go to **SQL Editor**
6. Run this to set roles:

```sql
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
```

### Option 2: Using Supabase Admin API

You can use the Supabase Admin API with your service_role key to create users programmatically. This requires a server-side script.

---

## ⚠️ Security Notes

- **Change passwords immediately** after first login
- **Admin and Owner accounts** have full system access
- **Staff accounts** can only manage customers and transactions
- Only **Admin/Owner** can create new user accounts through the admin panel

---

## 🔄 After Creating Accounts

1. Test login with each account
2. Verify roles are set correctly
3. Test permissions (admin can access user management, staff cannot)
4. Change default passwords to secure ones

---

## 📝 Notes

- User profiles are automatically created when users are added to `auth.users` (via trigger)
- Roles can be updated in the `profiles` table
- Only admin/owner can access the user management page

