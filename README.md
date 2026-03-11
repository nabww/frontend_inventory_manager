# EMR Device Inventory — Frontend

React SPA for managing EMR tablets and SIM cards across health facilities in Homa Bay and Kisii counties, Kenya.

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 |
| Routing | React Router 6 |
| HTTP | Axios |
| Notifications | react-hot-toast |
| Icons | react-icons (Remix Icons) |
| Date formatting | date-fns |
| Styling | Custom CSS (purple/white theme, dark mode) |

---

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── index.js          # All axios calls (authApi, deviceApi, refApi, etc.)
│   ├── components/
│   │   ├── common/           # Modal, Field, Spinner, ErrAlert, SectionLabel
│   │   └── layout/
│   │       └── index.jsx     # Sidebar, Topbar, AppShell, Logo
│   ├── contexts/
│   │   └── index.jsx         # AuthContext, ThemeContext
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DeviceListPage.jsx
│   │   ├── DeviceDetailPage.jsx
│   │   ├── FacilityDetailPage.jsx
│   │   ├── OtherPages.jsx    # Verification, Users, Audit Log, Facilities list
│   │   └── ...
│   ├── App.js                # Routes
│   ├── index.css             # Global styles + CSS variables
│   └── index.js
└── package.json
```

---

## Environment Variables

Create a `.env` file in the frontend root:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production (Vercel), set this in the Vercel dashboard or use a `vercel.json` rewrite to proxy `/api/*` to the backend URL.

**`vercel.json` example:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.railway.app/api/:path*"
    }
  ]
}
```

---

## Running Locally

```bash
npm install
npm start       # Runs on http://localhost:3000
```

Production build:
```bash
npm run build   # Output in /build
```

For the Linux server self-hosted deployment, copy the `/build` folder to the Nginx web root.

---

## Features

### Authentication
- JWT-based login with token stored in `localStorage`
- Auto-logout on token expiry
- Change password from the sidebar user pill
- Role-aware UI — admin-only actions are hidden from lower roles

### Dashboard
- Summary cards: total devices, active, lost, under repair
- Recent activity feed

### Device Management
- Paginated, searchable, filterable device list
- Filter by status, county, affiliation
- Add / edit devices with SIM card linking
- Export to XLSX
- Bulk import via XLSX template
- Device detail page with full history

### Loss Reporting
- Field officers can mark a device as lost via a dedicated modal
- Uploads incident report and police OB as PDFs
- Device is automatically locked on submission
- Admins receive email alerts with PDF attachments
- Admins can acknowledge, reject, escalate, or mark as recovered
- PDF documents viewable/downloadable inline (authenticated blob fetch)

### Annual Verification
- Submit verification per device: pass / fail / partial / lost
- Verification history per device

### Facility Management
- Browse and filter facilities by county / sub-county
- Facility detail with linked devices
- Bulk import via XLSX

### Users (Admin only)
- Create, edit, deactivate users
- Assign roles: viewer / field_officer / admin

### Audit Log (Admin only)
- Full record of all create / update / delete actions

### Mobile Support
- Responsive layout with slide-in sidebar on mobile
- Hamburger menu in topbar
- Overlay to dismiss sidebar
- Tables and grids reflow for small screens

### Dark Mode
- System-aware default, toggleable via topbar button
- CSS custom properties for full theme coverage

---

## Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/dashboard` | Dashboard | Auth |
| `/devices` | Device list | Auth |
| `/devices/:id` | Device detail | Auth |
| `/verify` | Verification list | Auth |
| `/facilities` | Facility list | Auth |
| `/facilities/:id` | Facility detail | Auth |
| `/users` | User management | Admin |
| `/audit-log` | Audit log | Admin |

---

## Key Components

### `AppShell`
Wraps all authenticated pages. Manages sidebar open/close state for mobile. Passes props to `Sidebar` and `Topbar`.

### `Sidebar`
Fixed navigation with role-based links. On mobile, slides in from the left with a close button. Includes the user pill (name, role, change password, logout).

### `Topbar`
Fixed header with page title, hamburger (mobile only), and dark mode toggle.

### `DeviceDetailPage`
The most complex page — shows full device info, SIM details, verification history, loss report status, and document viewer. Admins see loss review controls and transfer history.

### `DeviceFormModal`
Add/edit device form. Intercepts the "lost" status to open `LossReportModal` instead of saving directly.

---

## Deployment

### Vercel (Cloud)

```bash
# From frontend directory
vercel --prod
```

Set `REACT_APP_API_URL` in Vercel environment variables, or use the `vercel.json` proxy rewrite approach to avoid CORS issues.

### Linux Server (Self-hosted)

```bash
npm run build

# Copy build to Nginx web root
cp -r build/* /path/to/nginx/root/

# Nginx serves the build on port 3000
# /api/* is proxied to the backend on port 5000
# All other routes serve index.html (React Router)
```

See `server-setup.md` for the full Nginx configuration.
