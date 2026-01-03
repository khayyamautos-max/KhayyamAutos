# Step-by-Step User Setup Guide

## 📋 Part 1: Create Users in Supabase Dashboard

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **tvcpnewfoqmgvqmucxsd** (or click on your project)

### Step 2: Navigate to Authentication
1. In the left sidebar, look for **Authentication** (it has a key/lock icon)
2. Click on **Authentication**
3. You'll see a submenu - click on **Users**

### Step 3: Create First User (Admin)
1. Click the **"Add User"** button (usually at the top right)
2. A dialog will appear - select **"Create new user"**
3. Fill in:
   - **Email:** `admin@khayyamautos.com`
   - **Password:** `Admin@2024!`
   - **Auto Confirm User:** ✅ Check this box (so user can login immediately)
4. Click **"Create User"**
5. Wait for success message

### Step 4: Create Second User (Owner)
1. Click **"Add User"** again
2. Select **"Create new user"**
3. Fill in:
   - **Email:** `owner@khayyamautos.com`
   - **Password:** `Owner@2024!`
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create User"**

### Step 5: Create Third User (Staff 1)
1. Click **"Add User"**
2. Select **"Create new user"**
3. Fill in:
   - **Email:** `staff1@khayyamautos.com`
   - **Password:** `Staff@2024!`
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create User"**

### Step 6: Create Fourth User (Staff 2)
1. Click **"Add User"**
2. Select **"Create new user"**
3. Fill in:
   - **Email:** `staff2@khayyamautos.com`
   - **Password:** `Staff@2024!`
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create User"**

### Step 7: Create Fifth User (Staff 3)
1. Click **"Add User"**
2. Select **"Create new user"**
3. Fill in:
   - **Email:** `staff3@khayyamautos.com`
   - **Password:** `Staff@2024!`
   - **Auto Confirm User:** ✅ Check this box
4. Click **"Create User"**

### Step 8: Verify Users Created
1. You should now see all 5 users in the Users list
2. Each user should have:
   - Their email address
   - Status: "Confirmed" (if you checked Auto Confirm)
   - Created date

---

## 📋 Part 2: Set User Roles Using SQL

### Step 1: Open SQL Editor
1. In the left sidebar, find **SQL Editor** (it has a code/terminal icon)
2. Click on **SQL Editor**

### Step 2: Create New Query
1. Click the **"New Query"** button (top left, usually a "+" icon or "New Query" text)
2. A new query tab will open

### Step 3: Copy the SQL Script
1. Open the file `scripts/005_set_user_roles.sql` in your project
2. Copy the ENTIRE contents of the file (Ctrl+A, then Ctrl+C)

### Step 4: Paste into SQL Editor
1. Click in the SQL Editor text area
2. Paste the SQL code (Ctrl+V)
3. You should see SQL code like:
```sql
-- Set admin role
UPDATE public.profiles 
SET role = 'admin', full_name = 'System Administrator'
WHERE email = 'admin@khayyamautos.com';
-- ... (more code)
```

### Step 5: Run the SQL Script
1. Click the **"Run"** button (usually green, at the bottom right)
   - OR press **Ctrl+Enter** (Windows) or **Cmd+Enter** (Mac)
2. Wait a few seconds for execution
3. You should see a success message: **"Success. No rows returned"** or similar

### Step 6: Verify Roles Were Set
1. In the same SQL Editor, create a new query
2. Paste this verification query:
```sql
SELECT email, full_name, role FROM public.profiles ORDER BY role, email;
```
3. Click **Run**
4. You should see a table with all 5 users showing their:
   - Email
   - Full Name
   - Role (admin, owner, or staff)

---

## 📋 Part 3: Test the Accounts

### Step 1: Open Your Application
1. Make sure your dev server is running
2. Open browser and go to: **http://localhost:3000**
3. You should see the login page

### Step 2: Test Admin Account
1. **Email:** `admin@khayyamautos.com`
2. **Password:** `Admin@2024!`
3. Click **Login**
4. You should be redirected to the Dashboard
5. **Check the sidebar** - you should see **"User Management"** link at the bottom of the menu
6. Click on **"User Management"** - you should see all 5 users listed

### Step 3: Test Owner Account
1. Click **Logout** (bottom of sidebar)
2. Login with:
   - **Email:** `owner@khayyamautos.com`
   - **Password:** `Owner@2024!`
3. You should see the Dashboard
4. **Check the sidebar** - you should see **"User Management"** link
5. Click on it - you should see all users

### Step 4: Test Staff Account
1. Click **Logout**
2. Login with:
   - **Email:** `staff1@khayyamautos.com`
   - **Password:** `Staff@2024!`
3. You should see the Dashboard
4. **Check the sidebar** - you should NOT see **"User Management"** link
5. Try going directly to: `http://localhost:3000/users`
   - You should be redirected to Dashboard (access denied)

### Step 5: Test Other Staff Accounts
1. Logout and test `staff2@khayyamautos.com` and `staff3@khayyamautos.com`
2. Both should work the same as staff1 - no User Management access

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] All 5 users created in Supabase Dashboard
- [ ] All users have "Confirmed" status
- [ ] SQL script ran successfully
- [ ] Verification query shows all users with correct roles
- [ ] Admin can login and see "User Management"
- [ ] Owner can login and see "User Management"
- [ ] Staff accounts can login but DON'T see "User Management"
- [ ] Staff accounts are redirected when trying to access `/users`

---

## 🐛 Troubleshooting

### Problem: "User not found" when logging in
**Solution:** 
- Check if user was created in Supabase Dashboard
- Verify email is spelled correctly
- Check if "Auto Confirm User" was checked

### Problem: "Incorrect password"
**Solution:**
- Double-check the password (case-sensitive)
- Make sure there are no extra spaces
- Try resetting password in Supabase Dashboard

### Problem: Admin/Owner doesn't see "User Management"
**Solution:**
- Verify the role was set correctly in SQL
- Run the verification query to check roles
- Make sure you ran `scripts/005_set_user_roles.sql`

### Problem: SQL script gives error
**Solution:**
- Make sure users were created FIRST before running the SQL
- Check for typos in email addresses
- Verify the profiles table exists (should be created by `001_initial_schema.sql`)

### Problem: Can't access User Management page
**Solution:**
- Make sure you're logged in as admin or owner
- Check browser console for errors
- Try refreshing the page

---

## 📝 Quick Reference

### User Credentials:
```
Admin:   admin@khayyamautos.com    / Admin@2024!
Owner:   owner@khayyamautos.com    / Owner@2024!
Staff 1: staff1@khayyamautos.com   / Staff@2024!
Staff 2: staff2@khayyamautos.com   / Staff@2024!
Staff 3: staff3@khayyamautos.com   / Staff@2024!
```

### Important URLs:
- Supabase Dashboard: https://supabase.com/dashboard/project/tvcpnewfoqmgvqmucxsd
- Local App: http://localhost:3000
- User Management: http://localhost:3000/users (admin/owner only)

---

**Follow these steps in order, and you'll have everything set up!** 🎉

