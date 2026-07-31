# 📚 StudyStream

A modern, secure, and mobile-friendly video streaming platform for private study groups. Built with Next.js, PostgreSQL, and Tailwind CSS.

![StudyStream](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-Private-red)

## ✨ Features

### 🔐 Authentication & Security
- Mobile number + password authentication
- Secure password hashing with bcrypt (12 rounds)
- HTTP-only cookie sessions with JWT
- Failed login redirects to Google (no error exposure)
- Route protection via middleware
- Role-based access control (Admin/Guest)

### 📺 Video Streaming
- Multi-server support per lecture
- Instant server switching
- Fullscreen & theater modes
- Keyboard shortcuts (F: fullscreen, T: theater)
- Watch history tracking
- Resume from last position
- Favorites system

### 🔒 Anti-Piracy Watermark
- Floating watermark overlay
- Displays user name + mobile number
- Continuously moving (30-second cycle)
- Visible in fullscreen mode
- Cannot be easily cropped

### 👨‍💼 Admin Dashboard
- **Users**: Create, edit, delete, enable/disable accounts
- **Batches**: Organize content into course batches
- **Subjects**: Group lectures under subjects
- **Lectures**: Manage individual lectures with multiple servers
- **Permissions**: Granular access control at batch/subject/lecture level
- **Bulk Import**: Import 500+ lectures via CSV/JSON
- **Analytics**: View platform statistics

### 🎨 Modern UI/UX
- Dark mode design (Netflix-inspired)
- Fully responsive (mobile-first)
- Smooth animations
- Loading skeletons
- Toast notifications
- Search & filtering
- Clean, intuitive navigation

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | JWT + HTTP-only cookies |
| Password | bcryptjs |
| Hosting | Vercel (recommended) |
| DB Hosting | Supabase (recommended) |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── admin/          # Admin-only APIs
│   │   ├── auth/           # Authentication APIs
│   │   ├── batches/        # Batch CRUD
│   │   ├── subjects/       # Subject CRUD
│   │   ├── lectures/       # Lecture CRUD
│   │   ├── history/        # Watch history
│   │   └── favorites/      # User favorites
│   ├── dashboard/
│   │   ├── admin/          # Admin pages
│   │   ├── batches/        # Browse batches
│   │   ├── subjects/       # Browse subjects
│   │   ├── watch/          # Video player
│   │   ├── history/        # Watch history
│   │   └── favorites/      # Favorites
│   ├── page.tsx            # Login page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Drizzle schema
├── lib/
│   ├── auth.ts             # Auth utilities
│   └── api-helpers.ts      # API helpers
└── middleware.ts           # Route protection
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd studystream
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

4. **Push database schema**
```bash
npx drizzle-kit push
```

5. **Create admin user**
```bash
# Use the SQL in DEPLOYMENT_GUIDE.md
```

6. **Start development server**
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## 📖 Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed GUI-based deployment instructions using Vercel and Supabase.

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT signing (64+ chars) | ✅ |

## 📊 Database Schema

### Tables
- **users** - User accounts with hashed passwords
- **sessions** - Active login sessions
- **batches** - Course batches (e.g., PCM, Mains)
- **subjects** - Subjects within batches
- **lectures** - Individual lectures with embed URLs
- **permissions** - Access control rules
- **watch_history** - User viewing progress
- **favorites** - User favorite lectures
- **settings** - Platform configuration

## 🎥 Supported Video Sources

- YouTube (embed URLs)
- Vimeo (embed URLs)
- Google Drive (preview URLs)
- Any iframe-compatible video host

## 📱 Responsive Breakpoints

| Breakpoint | Device |
|------------|--------|
| < 640px | Mobile |
| 640px - 1024px | Tablet |
| > 1024px | Desktop |

## 🔐 Security Features

1. **No Plain-text Passwords** - All passwords hashed with bcrypt
2. **HTTP-only Cookies** - Prevents XSS token theft
3. **Middleware Protection** - All routes protected by default
4. **Role-based Access** - Admin/Guest separation
5. **Silent Failures** - No error messages on failed login
6. **Session Expiry** - 7-day auto-logout
7. **Watermark Protection** - User identification on videos

## 📈 Bulk Import Format

### CSV Format
```csv
title,batchName,subjectName,lectureNumber,description,duration,server1,server2,server3
Lecture 1,PCM Batch,Physics,1,Description,1:30:00,https://embed1,https://embed2,
```

### JSON Format
```json
[
  {
    "title": "Lecture 1",
    "batchName": "PCM Batch",
    "subjectName": "Physics",
    "lectureNumber": 1,
    "description": "Description",
    "duration": "1:30:00",
    "server1": "https://embed1",
    "server2": "https://embed2"
  }
]
```

## 🤝 Contributing

This is a private project. Contact the administrator for access.

## 📄 License

Private - All rights reserved.

---

Built with ❤️ for study groups
