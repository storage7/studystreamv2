# 🚀 StudyStream Deployment Guide

## Complete GUI-Based Deployment Instructions

This guide will walk you through deploying StudyStream to **Vercel** with a **Supabase** PostgreSQL database using only graphical user interfaces (no command line required).

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ A **GitHub** account ([Sign up here](https://github.com/signup))
- ✅ A **Vercel** account ([Sign up here](https://vercel.com/signup))
- ✅ A **Supabase** account ([Sign up here](https://supabase.com/dashboard/sign-up))

---

## 📁 Step 1: Push Code to GitHub

### 1.1 Create a New Repository

1. Go to [github.com/new](https://github.com/new)
2. Fill in the details:
   - **Repository name**: `studystream` (or any name you prefer)
   - **Description**: "Private video streaming platform for study groups"
   - **Visibility**: Select **Private** (important for security!)
3. Click **"Create repository"**

### 1.2 Upload Project Files

1. On your new repository page, click **"uploading an existing file"** link
2. Drag and drop ALL project files (or use the file chooser)
3. **⚠️ IMPORTANT**: Do NOT upload the `.env` file (it contains secrets)
4. Write a commit message: "Initial commit"
5. Click **"Commit changes"**

### 1.3 Verify Upload

Make sure these files/folders are present in your repository:
```
├── src/
│   ├── app/
│   ├── db/
│   ├── lib/
│   └── middleware.ts
├── package.json
├── next.config.ts
├── tsconfig.json
└── drizzle.config.json
```

---

## 🗄️ Step 2: Set Up Supabase Database

### 2.1 Create a New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `studystream-db`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Free tier is sufficient to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be created

### 2.2 Get Your Database Connection String

1. In your Supabase project dashboard, click **"Project Settings"** (gear icon in sidebar)
2. Click **"Database"** in the left menu
3. Scroll down to **"Connection string"** section
4. Select **"URI"** tab
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the database password you created earlier

### 2.3 Create Database Tables

1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Paste the following SQL and click **"Run"**:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'guest',
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  thumbnail TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  thumbnail TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  lecture_number INTEGER NOT NULL DEFAULT 1,
  thumbnail TEXT,
  duration VARCHAR(50),
  servers JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Watch history table
CREATE TABLE IF NOT EXISTS watch_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_server VARCHAR(255),
  last_watched TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

4. You should see "Success. No rows returned" message

### 2.4 Create Your Admin User

1. Still in SQL Editor, click **"New query"**
2. **First, generate a password hash**. Go to [bcrypt-generator.com](https://bcrypt-generator.com/):
   - Enter your desired admin password
   - Set rounds to **12**
   - Click **"Hash!"**
   - Copy the generated hash
3. Back in Supabase SQL Editor, paste this SQL (replace the values):

```sql
INSERT INTO users (full_name, mobile, password_hash, role, active)
VALUES (
  'Your Name',                    -- Replace with your name
  '9999999999',                   -- Replace with your mobile number
  '$2a$12$xxxYourHashedPasswordxxx',  -- Replace with the hash from bcrypt-generator
  'admin',
  true
);
```

4. Click **"Run"**

---

## ▲ Step 3: Deploy to Vercel

### 3.1 Import Your GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import"** next to your `studystream` repository
3. If you don't see it, click **"Adjust GitHub App Permissions"** and grant access

### 3.2 Configure Project Settings

1. **Project Name**: `studystream` (or your preferred name)
2. **Framework Preset**: Should auto-detect as **Next.js**
3. **Root Directory**: Leave as `.` (root)

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add these variables one by one:

| Variable Name | Value |
|--------------|-------|
| `DATABASE_URL` | Your Supabase connection string from Step 2.2 |
| `JWT_SECRET` | A random 64-character string (generate at [randomkeygen.com](https://randomkeygen.com/)) |

**Example:**
```
DATABASE_URL = postgresql://postgres.xxxx:YourPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET = kL9mN2pQ4rS6tU8vW0xY1zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5xY7zA9b
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for the build to complete
3. Once deployed, click **"Visit"** to see your live site!

---

## 🔐 Step 4: First Login

1. Open your deployed site URL (e.g., `https://studystream.vercel.app`)
2. You'll see the login page
3. Enter:
   - **Mobile Number**: The mobile number you used in Step 2.4
   - **Password**: Your original password (not the hash!)
4. Click **"Sign In"**
5. You should now see the admin dashboard! 🎉

---

## 📚 Step 5: Adding Content

### Via Admin Panel (Recommended)

1. Log in as admin
2. Click **"Admin Panel"** in the sidebar
3. Use these sections:
   - **Batches**: Create course batches (e.g., "PCM Batch", "JEE Mains")
   - **Subjects**: Add subjects to each batch
   - **Lectures**: Add individual lectures with embed URLs
   - **Users**: Create accounts for your friends

### Via Bulk Import

1. Go to **Admin Panel → Bulk Import**
2. Prepare a CSV file with this format:
```csv
title,batchName,subjectName,lectureNumber,description,duration,server1,server2
Introduction to Physics,PCM Batch,Physics,1,Basics of physics,1:30:00,https://embed.url/1,https://embed2.url/1
Newton's Laws,PCM Batch,Physics,2,Laws of motion,1:45:00,https://embed.url/2,
```
3. Upload or paste the CSV content
4. Click **"Import Lectures"**

---

## 👥 Step 6: Adding Users

### Create User Accounts

1. Go to **Admin Panel → Users**
2. Click **"+ Add User"**
3. Fill in:
   - **Full Name**: User's name
   - **Mobile**: Their mobile number (used for login)
   - **Password**: Create a password for them
   - **Role**: Select "Guest" for regular users
   - **Active**: Keep checked
   - **Expiry Date**: Optional - set if you want auto-disable
4. Click **"Save"**
5. Share the mobile number and password with your friend

---

## 🔧 Troubleshooting

### "Redirect to Google" on Login
- This means credentials are wrong (by design - no error messages shown)
- Double-check the mobile number and password
- Verify the user exists and is active in Supabase

### Database Connection Error
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `DATABASE_URL` is correct
3. Make sure you replaced `[YOUR-PASSWORD]` with actual password
4. Redeploy: Go to Deployments → Click "..." on latest → Redeploy

### Build Fails on Vercel
1. Check the build logs for specific errors
2. Common fixes:
   - Ensure all files are uploaded to GitHub
   - Verify `package.json` is in root directory
   - Check environment variables are set

### Can't Access Admin Panel
- Make sure your user's role is set to `admin` (not `guest`)
- Check in Supabase: SQL Editor → Run:
```sql
SELECT * FROM users WHERE mobile = 'your_mobile_number';
```

---

## 🛡️ Security Checklist

Before going live, ensure:

- [ ] GitHub repository is set to **Private**
- [ ] `.env` file is NOT uploaded to GitHub
- [ ] Strong `JWT_SECRET` is set (64+ characters)
- [ ] Strong database password is used
- [ ] Admin password is strong and unique
- [ ] Supabase project has Row Level Security disabled (our app handles auth)

---

## 📊 Database Management via Supabase GUI

### View All Data
1. Go to Supabase Dashboard → Table Editor
2. Browse tables: users, batches, subjects, lectures, etc.

### Edit Data Directly
1. Click on any row to edit
2. Make changes and click Save

### Export Data
1. Table Editor → Select table
2. Click "Export" → Choose CSV or JSON

### Run Custom Queries
1. SQL Editor → New Query
2. Write and run SQL commands

---

## 🔄 Updating the Application

### When You Make Code Changes:

1. Push changes to GitHub (via GitHub Desktop or web interface)
2. Vercel automatically detects and redeploys

### Force Redeploy:
1. Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Select "Redeploy"

---

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktops

---

## 🎥 Supported Video Embeds

StudyStream supports embedded videos from:
- YouTube (embed URLs)
- Vimeo (embed URLs)
- Google Drive (embed URLs)
- Any iframe-compatible video hosting service

### How to Get Embed URLs:

**YouTube:**
1. Go to video → Share → Embed
2. Copy the `src` URL from the iframe code
3. Example: `https://www.youtube.com/embed/VIDEO_ID`

**Google Drive:**
1. Right-click video → Open in new window
2. Replace `/view` with `/preview` in URL
3. Example: `https://drive.google.com/file/d/FILE_ID/preview`

---

## 💡 Tips for Managing 500+ Lectures

1. **Use Bulk Import**: Create CSV with all lectures and import at once
2. **Organize by Batch**: Create separate batches for different courses
3. **Number Lectures**: Use lecture numbers for proper ordering
4. **Multiple Servers**: Add backup servers for each lecture
5. **Use Thumbnails**: Add thumbnail URLs for better visual appeal

---

## 📞 Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review Vercel build logs for errors
3. Check Supabase logs: Dashboard → Logs → Database

---

## 🎉 You're Done!

Your private study streaming platform is now live! Share the URL and login credentials only with trusted friends.

**Default Login Credentials:**
- URL: `https://your-project.vercel.app`
- Mobile: (the one you set up)
- Password: (the one you created)

Remember: Failed login attempts redirect to Google.com - this is intentional for security!
