# Energy Analyzer — Full-Stack MERN Application

A production-ready, full-stack MERN (MongoDB, Express, React, Node.js) application transformed from a static wellness tracker. It measures user sleep, screen time, water intake, and stress levels to calculate daily energy scores, provides interactive charts, provides personalized AI-driven health tips, and includes a role-based administrative management system.

---

## Key Features

1. **JWT & bcrypt Authentication**: Secure user registration and login, password hashing, and token-based protected API routes.
2. **Daily Metrics Log (CRUD)**: Users can add, edit, view, and delete their daily energy records stored persistently in MongoDB Atlas.
3. **Interactive Analytics Dashboard**: Displays the daily score using an animated counter and renders a multi-colored bar chart using Chart.js.
4. **AI-Based Recommendations**: Integrates Google Gemini AI (`gemini-1.5-flash`) via the official SDK to generate daily wellness tips. Includes a robust local heuristic recommendation fallback when no API key is provided.
5. **Search & Filters**: History page with range selectors (date range, energy score limits) and sorting (Newest, Oldest, Highest/Lowest Scores).
6. **PDF Report Generator**: Exporters compiling history logs into formatted tables with aggregates.
7. **Profile Management**: View personal averages (average sleep, water, stress, energy score) and update credentials safely.
8. **Role-Based Admin Dashboard**: Administrative users can view platform-wide stats (total users, global records, platform averages) and manage users (change roles to/from admin, delete users).

---

## Directory Structure

```
Energy Analyzer/
├── client/                 # React Frontend (Vite)
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # UI elements
│   │   ├── context/        # Session Context (AuthContext)
│   │   ├── pages/          # App Views (Home, Auth, Analysis, Dashboard, History, Profile, Admin)
│   │   ├── App.jsx         # App Entry Wrapper
│   │   ├── MainApp.jsx     # Navigation and SPA Route Coordinator
│   │   ├── index.css       # Clean styling system matching original CSS
│   │   └── main.jsx        # DOM rendering setup
│   ├── index.html          # Vite template
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build configurations and proxy
├── server/                 # Express Backend (Node.js)
│   ├── config/             # DB configurations
│   ├── controllers/        # Express handlers (Auth, Records, Admin, AI)
│   ├── middleware/         # Auth verify token & Role checks
│   ├── models/             # Mongoose schemas (User, EnergyRecord)
│   ├── routes/             # REST Endpoints
│   ├── index.js            # Server entrypoint
│   ├── package.json        # Backend dependencies
│   ├── .env                # Secret configurations
│   └── .env.example        # Environment templates
├── package.json            # Root manager (runs client & server concurrently)
└── README.md               # User manual and documentation
```

---

## Local Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB (Local Community Server or Atlas URI)

### Setup Steps
1. **Clone/Extract** the files into your directory.
2. **Install all dependencies** from the root folder:
   ```bash
   npm run install-all
   ```
   *This automatically runs `npm install` in the root, `/client`, and `/server` folders.*

3. **Configure Environment Variables**:
   In the `server/` directory, copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp server/.env.example server/.env
   ```
   *Configure your `MONGO_URI` (MongoDB connection string) and `JWT_SECRET` (used to sign tokens).*

4. **Launch Local Development Server**:
   From the root folder, run:
   ```bash
   npm run dev
   ```
   *This uses `concurrently` to run the Express API (port 5000) and the Vite frontend (port 5173).*
   *Vite is configured to proxy `/api` calls directly to the Express server to prevent CORS issues.*

---

## Environment Variables Configuration (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port number | `5000` |
| `MONGO_URI` | MongoDB Atlas Connection URI | `mongodb+srv://admin:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret token signing string | `984u32h4ui32hr47832yriudhsjkla` |
| `GEMINI_API_KEY` | (Optional) Gemini API credentials | `AIzaSyB...` |
| `NODE_ENV` | Environment | `development` or `production` |

*Note: If `GEMINI_API_KEY` is omitted, the server automatically defaults to the Local Analysis Engine.*

---

## REST API Reference

All requests and responses use JSON. Secure endpoints require the header `Authorization: Bearer <token>`.

### Authentication Endpoints
- **Register User**: `POST /api/auth/register`
  - Body: `{ "username": "ayush", "email": "ayush@example.com", "password": "password123" }`
  - *Note: The first user registered on a clean database is automatically assigned the `admin` role.*
- **Login User**: `POST /api/auth/login`
  - Body: `{ "emailOrUsername": "ayush@example.com", "password": "password123" }`
- **Get Profile**: `GET /api/auth/profile` *(Protected)*
- **Update Profile**: `PUT /api/auth/profile` *(Protected)*
  - Body: `{ "username": "newname", "email": "newemail@ex.com", "password": "newpassword" }`

### Energy Records Endpoints
- **Log Daily Energy**: `POST /api/records` *(Protected)*
  - Body: `{ "sleep": 7.5, "screenTime": 5, "waterIntake": 8, "stressLevel": 3, "date": "2026-06-29T00:00:00.000Z" }`
- **Fetch Records**: `GET /api/records` *(Protected)*
  - Query Params (optional): `startDate`, `endDate`, `minScore`, `maxScore`, `sortBy` (`newest`, `oldest`, `highestScore`, `lowestScore`)
- **Modify Record**: `PUT /api/records/:id` *(Protected)*
- **Delete Record**: `DELETE /api/records/:id` *(Protected)*
- **Get Personal Stats**: `GET /api/records/data/stats` *(Protected)*
- **Get AI recommendations**: `GET /api/records/data/ai-insight` *(Protected)*

### Admin Endpoints
- **Get Users List**: `GET /api/admin/users` *(Admin Only)*
- **Update User Role**: `PUT /api/admin/users/:id/role` *(Admin Only)*
  - Body: `{ "role": "admin" }`
- **Delete User Account**: `DELETE /api/admin/users/:id` *(Admin Only)*
- **Get Platform Stats**: `GET /api/admin/stats` *(Admin Only)*

---

## Production Deployment Guide

### 1. Database (MongoDB Atlas)
1. Register/Login to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared M0 cluster.
3. In **Database Access**, create a user with Read and Write permissions.
4. In **Network Access**, choose "Allow Access from Anywhere" (`0.0.0.0/0`) or input Vercel/Render host ranges.
5. Retrieve the MongoDB Connection string (`mongodb+srv://...`) and paste it as `MONGO_URI` in server environment settings.

### 2. Backend (Render or Railway)
1. Connect your Github repository to [Render](https://render.com/).
2. Create a new **Web Service** pointing to your repository.
3. Set the **Build Command** to:
   ```bash
   cd server && npm install
   ```
4. Set the **Start Command** to:
   ```bash
   cd server && npm start
   ```
5. Add your Environment variables under **Environment**:
   - `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `NODE_ENV` = `production`.
6. Note down the public URL Render generates (e.g. `https://energy-analyzer-backend.onrender.com`).

### 3. Frontend (Vercel or Netlify)
1. In your client project, update any API references if deploying separately, or construct build proxies.
2. In Vercel, import your project. Choose the `/client` directory as the project root.
3. Configure the **Build Command** to:
   ```bash
   npm run build
   ```
4. Configure the **Output Directory** to:
   ```bash
   dist
   ```
5. To routes all requests properly on refresh, create a `client/public/_redirects` or `client/vercel.json` rewrite:
   - For Vercel, a `vercel.json` file in `/client`:
     ```json
     {
       "rewrites": [
         { "source": "/api/(.*)", "destination": "https://your-backend-render-url.onrender.com/api/$1" },
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```
   - For Netlify, a `_redirects` file in `/client/public`:
     ```
     /api/*  https://your-backend-render-url.onrender.com/api/:splat  200
     /*      /index.html                                            200
     ```

---

## Development Credits
Developed by **Ayush Rai**. Full-stack migration configured by **Antigravity AI**.
