# RestroHub - Restaurant Management System

A complete, production-ready restaurant management system built with React, TypeScript, and SQLite (in-browser database).

![RestroHub](https://img.shields.io/badge/RestroHub-Restaurant%20Management-E63946)

## 🚀 Features

- **Role-based Access Control** (Admin, Cashier, Kitchen Staff)
- **Dashboard** with real-time analytics and charts
- **Menu Management** - Full CRUD operations
- **Order Management** - Create, track, and process orders
- **Kitchen Display** - Kanban-style order tracking with live timers
- **User Management** - Staff account management
- **Analytics** - Sales reports, best sellers, payment breakdown
- **In-Browser SQLite Database** - No backend required!

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** or **pnpm**

To check your versions:
```bash
node --version
npm --version
```

## 🛠️ Installation Steps

### Step 1: Clone or Download the Project

```bash
# If you have git installed
git clone <repository-url>
cd restaurant-management-system

# Or download and extract the ZIP file
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 2.5: Copy WASM File (Important!)

```bash
node scripts/copy-wasm.js
```

This copies the SQLite WASM file to the public folder. This is required for the database to work.

This will install all required packages including:
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- React Query
- sql.js (SQLite for browser)
- And more...

### Step 3: Start the Development Server

```bash
npm run dev
```

This will start the development server. You should see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Open in Browser

Open your browser and navigate to:
```
http://localhost:5173
```

## 🔐 Demo Credentials

The application comes pre-seeded with demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@restrohub.com | password |
| **Cashier** | cashier@restrohub.com | password |
| **Kitchen** | kitchen@restrohub.com | password |

### Role Permissions:

- **Admin**: Full access to all features (Dashboard, Menu, Orders, Kitchen, Analytics, Users)
- **Cashier**: Access to Orders and Analytics
- **Kitchen**: Access to Kitchen Display only

## 📁 Project Structure

```
src/
├── api/
│   └── mockApi.ts          # Mock API with SQLite integration
├── components/
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components (Sidebar, AppLayout)
│   ├── shared/             # Reusable components
│   └── ui/                 # UI primitives (Button, Card, Dialog, etc.)
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── db/
│   └── database.ts         # SQLite database setup and seeding
├── pages/
│   ├── admin/              # Admin pages (Dashboard, Menu, Analytics, Users)
│   ├── cashier/            # Cashier pages (Orders)
│   └── kitchen/            # Kitchen pages (Kitchen Display)
├── services/               # API service layers
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## 🏗️ Build for Production

To create a production build:

```bash
npm run build
```

The build output will be in the `dist/` folder. You can preview it with:

```bash
npm run preview
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 💾 Database

This application uses **sql.js**, which is SQLite compiled to WebAssembly. The database runs entirely in the browser with no backend required.

### Pre-seeded Data:
- 5 user accounts (different roles)
- 16 menu items across 6 categories
- 6 sample orders with items
- Analytics data

> **Note**: Data is stored in memory and will reset when you refresh the page. This is intentional for demo purposes.

## 🎨 Design System

The application uses a custom color palette:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#E63946` | Coral Red - Primary buttons, active states |
| Secondary | `#2A9D8F` | Teal - Success states, "Ready" badges |
| Accent | `#F4A261` | Warm Orange - Highlights, "Pending" badges |
| Background | `#F7F7F7` | Light Gray - Page backgrounds |
| Surface | `#FFFFFF` | White - Cards, dialogs |

## 🐛 Troubleshooting

### "Invalid credentials" error on login

1. Open browser Developer Tools (F12)
2. Go to the Console tab
3. Try logging in again
4. Check the console for debug messages showing:
   - Database initialization status
   - Available users in the database
   - Login attempt details

### Database not loading

- Make sure you have a stable internet connection (sql.js loads from CDN)
- Try clearing browser cache and refreshing
- Check console for any loading errors

### Styles not loading correctly

```bash
# Stop the dev server (Ctrl+C) and run:
npm run dev
```

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar navigation
- **Tablet**: Collapsible sidebar, optimized kitchen display
- **Mobile**: Hamburger menu, stacked layouts

## 🤝 Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Database**: sql.js (SQLite in browser)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📝 Environment Variables

Create a `.env` file (optional, for future API integration):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Currently, the app uses the mock API with SQLite, so no environment variables are required.

---

Made with ❤️ using React + Vite + Tailwind CSS
