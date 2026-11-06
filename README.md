# 🌸 GLOBAL SERVICE — Incident & IT Support Management System

A modern, chic, and responsive **Incident Management & IT Support Request System** developed for **GLOBAL SERVICE**. 

Crafted with an elegant, feminine, high-end SaaS aesthetic, this application synthesizes the best design workflows from industry-leading platforms:
- **Jira Service Management**: Intuitive sidebar navigation, categorized queues, and quick status tracking.
- **Freshservice**: Friendly, approachable cards, vibrant priority pills, and streamlined ticket logging.
- **ServiceNow**: Structured resolution workflows and incident escalation.
- **GLPI & ManageEngine ServiceDesk Plus**: Clear technician assignments, ticket activity tracking, and comprehensive admin analytics.

---

## 📑 Table of Contents
1. [Core Features & System Interfaces](#-core-features--system-interfaces)
2. [Design System & Aesthetic](#-design-system--aesthetic)
3. [Technology Stack](#-technology-stack)
4. [Prerequisites](#-prerequisites)
5. [Step-by-Step Setup & How to Run](#-step-by-step-setup--how-to-run)
   - [Step 1: Database Setup](#step-1-database-setup)
   - [Step 2: Backend Server Setup](#step-2-backend-server-setup)
   - [Step 3: Frontend Client Setup](#step-3-frontend-client-setup)
6. [Demo Accounts & Login Credentials](#-demo-accounts--login-credentials)
7. [Project Structure](#-project-structure)
8. [API Endpoints Overview](#-api-endpoints-overview)
9. [Troubleshooting](#-troubleshooting)

---

## 🌟 Core Features & System Interfaces

### 1. 👩‍💼 Employee / Staff Interface (`/dashboard`)
- **Quick Incident Reporting (`/dashboard/new`)**: Employees can submit hardware and software issues with a clear title, category picker, priority level, and detailed problem description.
- **My Tickets Dashboard (`/dashboard/tickets`)**: Real-time tracking of all submitted tickets, active status pills, technician resolution notes, and the ability to close resolved incidents.
- **Interactive KPI Cards**: Overview of Open, In Progress, Resolved, and Closed incidents.

### 2. 🛠️ IT Technician Interface (`/it`)
- **Available Queue (`/it/available`)**: Triage board of newly filed unassigned incidents waiting for technician attention with one-click "Take Charge".
- **Assigned Workload (`/it/tickets`)**: Work on claimed tickets, switch status between *Open* and *In Progress*, and mark tickets *Resolved* with detailed solution notes in a resolution modal.
- **Technician Dashboard (`/it`)**: Overview of workload stats and recent ticket allocations.

### 3. 🚨 Priority Management
- **High (🔴)**: Urgent blockers and outages requiring immediate attention.
- **Medium (🟡)**: Standard operational faults with normal business priority.
- **Low (🟢)**: Non-urgent inquiries, minor inconveniences, and feature requests.

### 4. 🔔 Real-Time Notifications
- Bell notification popup with badge counter in the top bar.
- Alerts employees when their incident is taken, updated, or resolved.
- Alerts technicians when new tickets are submitted.
- Optional email dispatch via Nodemailer/Gmail.

### 5. 👑 Administrator Control Center (`/admin`)
- **Central Overview (`/admin`)**: Real-time stats, total tickets, resolution rate, and category distribution charts.
- **All Tickets Dispatcher (`/admin/tickets`)**: Complete organizational oversight with direct manual technician assignment.
- **User Provisioning (`/admin/users`)**: Create and remove accounts for Staff, IT Technicians, and Admins.
- **Category Manager (`/admin/categories`)**: Create, rename, and manage classification categories.
- **Statistical Reports (`/admin/statistics`)**: Visual progress breakdowns by status, priority, and department category.

---

## 🎨 Design System & Aesthetic

- **Color Palette**: Sophisticated Rose Quartz & Velvet Fuchsia (`#f43f5e`, `#ec4899`, `#be123c`) paired with Amethyst Violet (`#7c3aed`), crisp porcelain cards (`#ffffff`), and radiant dark obsidian sidebar (`#191026`).
- **Typography**: Clean, geometric modern typography using Google Font **Plus Jakarta Sans**.
- **Badges**: High-contrast, color-coded priority and status pills inspired by Jira and Freshservice.
- **Responsive Layout**: Fluid layouts across mobile (<576px), tablet (<992px), and desktop with an off-canvas drawer navigation and scroll-friendly tables.

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, React Router 7, Vite 8, Bootstrap 5.3, Bootstrap Icons, Axios |
| **Backend** | Node.js (ES Modules), Express 5, MySQL2 (`mysql2/promise`), JWT, Bcryptjs, Nodemailer, Dotenv, Cors |
| **Database** | MySQL / MariaDB |

---

## ⚙️ Prerequisites

Before running the project, make sure you have installed:
1. **Node.js** (v18.0.0 or higher) — [Download Node.js](https://nodejs.org/)
2. **MySQL Server** — either via:
   - **XAMPP** (recommended for quick local setup) — [Download XAMPP](https://www.apachefriends.org/)
   - Standalone **MySQL Community Server** / **MySQL Workbench**

---

## 🚀 Step-by-Step Setup & How to Run

### Step 1: Database Setup

1. Start **Apache** and **MySQL** in your XAMPP Control Panel (or start your MySQL service).
2. Open **phpMyAdmin** in your browser at `http://localhost/phpmyadmin` (or use MySQL Workbench / CLI).
3. Import the pre-configured SQL schema file located at:
   ```
   incident_app/server/schema.sql
   ```
   *Alternative via MySQL command line:*
   ```bash
   mysql -u root -p < server/schema.sql
   ```
   > This automatically creates the `incident_db` database, all necessary tables (`users`, `category`, `ticket`, `notification`), default categories, and 3 demo user accounts.

---

### Step 2: Backend Server Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd incident_app/server
   ```

2. Create a `.env` configuration file (you can copy `.env.example`):
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # Or on Mac / Linux / Git Bash:
   cp .env.example .env
   ```

3. Open `.env` and verify your MySQL credentials:
   ```env
   PORT=3000
   JWT_SECRET=globalservice_incident_management_super_secret_key_2026
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=incident_db

   # Optional Gmail notifications (leave commented out if testing locally)
   # MAIL_USER=your_email@gmail.com
   # MAIL_PASS=your_gmail_app_password
   ```

4. Install backend dependencies (if not already installed):
   ```bash
   npm install
   ```

5. Start the backend API server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *You should see:*
   ```
   Server is running on port 3000
   MySQL database connected successfully!
   ```

---

### Step 3: Frontend Client Setup

1. Open a **new terminal window** and navigate to `Frontendapp`:
   ```bash
   cd incident_app/Frontendapp
   ```

2. Install frontend dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## 🔑 Demo Accounts & Login Credentials

The `schema.sql` script creates pre-seeded demo accounts ready for testing all three roles:

| Role | Email Address | Password | Space / Route |
|---|---|---|---|
| **Administrator** | `admin@globalservice.com` | `password123` | `/admin` |
| **IT Support Technician** | `it@globalservice.com` | `password123` | `/it` |
| **Employee (Staff)** | `staff@globalservice.com` | `password123` | `/dashboard` |

> 💡 **Tip:** You can also register additional staff or technician accounts anytime from the Administrator dashboard under **Users** (`/admin/users`).

---

## 📁 Project Structure

```
incident_app/
├── Frontendapp/                     # React 19 Client (Vite)
│   ├── index.html                   # HTML template with Plus Jakarta Sans fonts
│   ├── vite.config.js               # Vite configuration
│   ├── package.json                 # Frontend dependencies
│   └── src/
│       ├── main.jsx                 # React root mounting & global styles
│       ├── App.jsx                  # React Router definitions & protected routes
│       ├── index.css                # Global design system & theme variables
│       ├── services/
│       │   └── api.js               # Axios instance with JWT interceptors
│       └── assets/
│           └── component/
│               ├── dashboard.css    # Sidebar, topbar, cards & table styling
│               ├── landing.css      # Modern responsive landing page styles
│               ├── style.css        # Authentication / login screen styling
│               ├── layout.jsx       # Global dashboard layout with responsive drawer
│               ├── landing.jsx      # Public welcome & service desk homepage
│               ├── login.jsx        # Glassmorphic login page
│               ├── NotificationBell.jsx # Live activity alerts popover
│               ├── StatCard.jsx     # Freshservice-style metric widget
│               ├── protectedRoute.jsx # Client-side role authorization guard
│               ├── StaffHome.jsx    # Employee overview dashboard
│               ├── CreateTicket.jsx # Incident creation form
│               ├── MyTickets.jsx    # Employee ticket history table
│               ├── ITHome.jsx       # Technician overview dashboard
│               ├── AvailableTickets.jsx # Unassigned ticket claim queue
│               ├── AssignedTickets.jsx # Technician resolution board & modal
│               ├── AdminHome.jsx    # Admin statistics & KPI dashboard
│               ├── AllTickets.jsx   # Global ticket list & technician assigner
│               ├── Users.jsx        # User account provisioning
│               ├── Categories.jsx   # Incident category management
│               └── Statistics.jsx   # Analytical breakdown charts
│
├── server/                          # Node.js Express REST API
│   ├── index.js                     # Main Express server & API routes
│   ├── schema.sql                   # MySQL database creation & seed script
│   ├── .env.example                 # Environment variables template
│   └── package.json                 # Backend dependencies
│
└── README.md                        # Project documentation & run guide
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/login` | Public | Authenticates user & returns JWT token |
| `GET` | `/categories` | Authenticated | Lists all incident categories |
| `POST` | `/categories` | Admin | Adds a new category |
| `PUT` | `/categories/:id` | Admin | Renames a category |
| `DELETE`| `/categories/:id` | Admin | Deletes a category |
| `POST` | `/tickets` | Staff | Submits a new incident ticket |
| `GET` | `/tickets/my` | Staff | Returns tickets filed by the logged-in user |
| `PUT` | `/tickets/:id/close`| Staff | Closes a resolved ticket |
| `GET` | `/tickets/unassigned`| IT Support | Lists unassigned open tickets |
| `GET` | `/tickets/assigned`| IT Support | Lists tickets assigned to current technician |
| `PUT` | `/tickets/:id/take-charge`| IT Support | Claims an unassigned open ticket |
| `PUT` | `/tickets/:id/status`| IT Support | Updates ticket status (`open` / `in_progress`) |
| `PUT` | `/tickets/:id/resolve`| IT Support | Resolves ticket with a resolution explanation |
| `GET` | `/tickets` | Admin | Retrieves all tickets across the system |
| `PUT` | `/tickets/:id/assign` | Admin | Assigns a ticket to a specific technician |
| `GET` | `/users` | Admin | Lists all user accounts |
| `POST` | `/users` | Admin | Registers a new user account |
| `DELETE`| `/users/:id` | Admin | Removes a user account |
| `GET` | `/stats` | Admin | Retrieves analytical metrics & category distributions |
| `GET` | `/notifications` | Authenticated | Retrieves recent notifications for the logged-in user |
| `PUT` | `/notifications/:id/read` | Authenticated | Marks a specific notification as read |
| `PUT` | `/notifications/read-all` | Authenticated | Marks all user notifications as read |

---

## ❓ Troubleshooting

- **`Cannot find module 'express'` or other packages**:
  Run `npm install` inside both `server` and `Frontendapp` directories.

- **`Missing JWT_SECRET in the .env file`**:
  Make sure you copied `server/.env.example` to `server/.env` and that `JWT_SECRET` is set.

- **`Database connection failed`**:
  Verify MySQL is running on port 3306 and that your `DB_USER` (usually `root`) and `DB_PASSWORD` (often empty in XAMPP) match your `.env` settings. Ensure the `incident_db` database was created with `schema.sql`.

- **CORS or Network errors**:
  Ensure the backend server is running on `http://localhost:3000` before accessing the frontend.

---

Made with 💖 for **GLOBAL SERVICE**.
