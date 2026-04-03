# Concordia Emergency — Campus Safety & Navigation Platform

**Course:** SOEN 6751 — Human–Computer Interaction  
**University:** Concordia University, Montreal  
**Version:** V3.0

**Team Members:**

| Role | Name | Student ID |
|------|------|------------|
| Group Leader | Jananee Aruboribaran | 40129224 |
| Member 1 | Yu-Hang Lin | 40266597 |
| Member 2 | Mridul Hossain | 40261486 |
| Member 3 | Renren Zhang | 40307575 |
| Member 4 | Yuhao Ma | 40301935 |

---

## 1. Problem Description

At Concordia University, thousands of students, faculty, and staff move through shared spaces every day. This movement can be disrupted by unexpected situations, including:

- **Protests or demonstrations** that block entrances or create crowd congestion
- **Construction zones** that reroute foot traffic or close accessible pathways
- **Emergency situations** such as fire alarms, police activity, or building evacuations
- **Service outages** (e.g., elevator malfunction) that disproportionately affect students with mobility needs
- **Weather-related hazards** such as icy walkways

Students currently have very limited sources to be informed consistently and in real time. They rarely know which routes are safe, which entrances are open, or how to avoid crowds during tense situations.

### Real-World Scenario

A protest is taking place at Concordia, blocking the Hall Building entrance. Students inside do not know which exit is safe to leave, while students outside are unaware of the protest. This application alerts users to the ongoing protest and suggests safe exit routes that dynamically avoid the danger zone.

---

## 2. V3.0 Architecture

V3 is a **frontend UI rewrite** with targeted backend enhancements. The goal was to replace V2's desktop multi-page architecture with an iOS-native style mobile interface, while adding a proper staff moderation workflow.

### What's New in V3.0

| Feature | Description |
|---------|-------------|
| **iOS Native UI** | Full frontend rewrite: iOS design system (SF Pro, crimson nav bar, grouped lists, tab bar, toggles) |
| **Staff Moderation Workflow** | New `PENDING → ACTIVE → RESOLVED` flow; students report → staff approve/resolve |
| **Staff Account** | Seeded staff account (`staff / campus123`) with `role: staff`; protected endpoints return 403 for students |
| **Role-Based Access Control** | Approve endpoint: staff only; Resolve endpoint: staff only; Report: all authenticated users |
| **Building Code Search** | Search bar prioritizes campus building codes (EV, H, LB) before falling back to Nominatim geocoding |
| **Production Deployment** | Deployed on Hetzner VPS via Coolify + Traefik; HTTPS via Cloudflare |
| **PostgreSQL in Production** | SQLite for local dev; PostgreSQL (Coolify managed) for production via `DATABASE_URL` env var |
| **3-Step Report Flow** | Replaced 5 independent hazard forms with a unified 3-step flow (select type → fill form → confirm) |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python, async) |
| ORM | SQLAlchemy (async sessions) |
| Database | SQLite (local dev) / PostgreSQL 18 (production) |
| Auth | JWT via python-jose + passlib + bcrypt |
| Frontend | Vanilla JavaScript + Leaflet.js |
| Maps | Leaflet + CartoDB light tiles |
| Routing | Valhalla (pedestrian mode with hazard avoidance + accessibility options) |
| Geocoding | Nominatim (with campus building code priority) |
| Real-time Updates | Polling (GET /api/alerts every 30s) |
| Deployment | Coolify 4.0 + Traefik on Hetzner VPS (Ubuntu 24.04) |

### Production Environment

| Item | Value |
|------|-------|
| Frontend | https://concordia.ailasai.com |
| Backend API | https://concordia-api.ailasai.com |
| Database | PostgreSQL 18 (Coolify managed) |
| VPS | Hetzner `46.225.149.31` |

---

## 3. User Goals & Implementation Status

| # | User Goal | V1 | V2 | V2.1 | V2.2 | V3.0 | Description |
|---|-----------|:--:|:--:|:----:|:----:|:----:|-------------|
| 1 | Create a User Account | ✅ | ✅ | ✅ | ✅ | ✅ | iOS-style login/signup; JWT session persistence |
| 2 | Activating Crisis Mode | 🔄 | ✅ | ✅ | ✅ | ✅ | Red background, non-essential UI dimmed, map stays interactive |
| 3 | Label Crowdsourced Data | ✅ | ✅ | ✅+ | ✅+ | ✅+ | "Reported by X students"; staff approval required before ACTIVE |
| 4 | Show a Thread Progress Bar | ✅ | ✅ | ✅ | ✅+ | ✅+ | PENDING → ACTIVE → RESOLVED with staff moderation |
| 5 | Navigating Without Internet | ❌ | ✅ | ✅ | ✅ | ✅ | Offline banner + offline building search |
| 6 | Receiving Proximity Alerts | ✅ | ✅ | ✅ | ✅ | ✅ | Popup within 50m of ACTIVE hazard, suppressed during Quiet Hours |
| 7 | Report Campus Hazards | 🔄 | ✅ | ✅+ | ✅+ | ✅+ | 3-step iOS flow; all reports start as PENDING |
| 8 | Get Accessible Routes | ✅ | ✅ | ✅+ | ✅+ | ✅+ | Valhalla routing + costing_options from Safety Profile |
| 9 | Control Notifications | ❌ | ✅ | ✅ | ✅ | ✅ | Toggle alert types; map re-renders instantly |
| 10 | Recent Alerts History | ✅ | ✅ | ✅ | ✅ | ✅ | Integrated in main app shell with segmented filter |

**V3.0 Summary:** 10 done ✅ (3 enhanced ✅+)

---

## 4. Installation

### Local Dev
```bash
# Clone
git clone https://github.com/linyuhang617/Concordia-Emergency-v3.git
cd Concordia-Emergency-v3

# Backend
pip install -r backend/requirements.txt
cd backend && uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && python3 -m http.server 8080
```

Open http://localhost:8080 in your browser. The SQLite database is auto-created on first run. Staff account (`staff / campus123`) is seeded automatically.

### Production
Deployed via Coolify. Push to `master` branch → trigger redeploy in Coolify dashboard.

---

## 5. Project Structure

```
Concordia-Emergency-v3/
├── backend/
│   ├── main.py              # FastAPI app, CORS, startup, seed_staff
│   ├── database.py          # SQLAlchemy async engine + DATABASE_URL env var
│   ├── models.py            # User (w/ role), Alert, UserPrefs
│   ├── schemas.py           # Pydantic schemas (UserResponse w/ role)
│   ├── dependencies.py      # get_db(), get_current_user()
│   ├── routers/
│   │   ├── auth.py          # signup, login, me
│   │   ├── alerts.py        # CRUD + approve (staff only) + resolve (staff only)
│   │   └── users.py         # prefs, profile
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── alert_service.py
│   │   └── user_service.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── index.html           # Login (iOS style)
    ├── signup.html          # Sign Up
    ├── app.html             # Main app shell (map + alert list + tab bar)
    ├── alert-detail.html    # Alert detail (role-based buttons)
    ├── alert-review.html    # Post-arrival review
    ├── profile.html         # Profile settings (iOS toggles)
    ├── report.html          # Report Step 1: select type
    ├── report-form.html     # Report Step 2: fill form
    ├── report-confirm.html  # Report Step 3: confirm & submit
    ├── nginx.conf
    ├── Dockerfile
    ├── scripts/
    │   ├── api.js           # window.API (auto-switches API_BASE)
    │   ├── auth.js          # Auth guard + text size
    │   └── map.js           # Map + alerts + routing + offline + crisis + building search
    ├── styles/
    │   └── ios.css          # Unified iOS design system
    └── data/
        └── building.js      # Campus building data
```

---

## 6. API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | — | Create account |
| POST | /api/auth/login | — | Authenticate, receive JWT |
| GET | /api/auth/me | ✅ | Current user info (includes `role`) |
| GET | /api/alerts | — | List all alerts (30s polling) |
| GET | /api/alerts/{id} | — | Alert detail |
| POST | /api/alerts | ✅ | Report hazard — always creates as `PENDING` |
| PATCH | /api/alerts/{id}/approve | ✅ Staff only | Approve alert: PENDING → ACTIVE |
| PATCH | /api/alerts/{id} | ✅ Resolve: Staff only | Update alert (review / resolve) |
| GET | /api/users/me/prefs | ✅ | Get user preferences |
| PUT | /api/users/me/prefs | ✅ | Update notification, quiet hours, navigation prefs |
| PUT | /api/users/me/profile | ✅ | Update username, email, accessibility settings |

---

## 7. Data Models

### User (V3.0)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| username | str | Unique |
| email | str | Unique |
| password_hash | str | bcrypt |
| **role** | **str** | **`student` (default) \| `staff`** |
| accessibility | JSON | Safety profile settings |
| created_at | datetime | Naive UTC |

### Alert (V3.0)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| type | str | Protest, Construction, Elevator Malfunction, Weather Hazard, Others |
| building_code | str | Campus building code |
| location_lat/lng | str | GPS coordinates |
| description | str | Cannot be empty |
| **status** | **str** | **PENDING (new report) → ACTIVE (staff approved) → RESOLVED (staff resolved)** |
| verification | str | "Reported by X students" |
| report_count | int | Number of students who reported |
| reported_by | str | FK to User.id |
| created_at | datetime | Naive UTC |
| updated_at | datetime | Naive UTC |

### Staff Moderation Flow (V3.0)
1. **Student reports** → alert created as `PENDING` (grey marker on map)
2. **Student Post-Arrival Review** → status stays `PENDING`
3. **Staff approves** (`PATCH /approve`) → `ACTIVE` (coloured marker on map)
4. **Staff resolves** (`PATCH /{id}` with `status: RESOLVED`) → `RESOLVED`
5. **403 Forbidden** returned if non-staff attempts approve or resolve

### Permission Matrix

| Action | Student | Staff |
|--------|---------|-------|
| Report (create alert) | ✅ | ✅ |
| Post-Arrival Review | ✅ | ✅ |
| Approve (PENDING → ACTIVE) | ❌ 403 | ✅ |
| Resolve (→ RESOLVED) | ❌ 403 | ✅ |

### Default Staff Account
| Field | Value |
|-------|-------|
| Username | `staff` |
| Password | `campus123` |
| Role | `staff` |

---

## 8. User Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Low Cognitive Load** | iOS design system: grouped lists, tab bar navigation, instant toggle saves |
| **Privacy First** | JWT token only; all user data server-side |
| **Reliability** | Staff moderation prevents unverified alerts from appearing as ACTIVE |
| **Speed** | 30s alert polling; in-memory prefs for instant map re-render; building code search skips Nominatim |
| **Low Battery Usage** | watchPosition with enableHighAccuracy; proximity check only on position change |
| **Community Trust** | "Reported by X students"; ACTIVE status requires staff approval |
| **Inclusivity** | Safety profile with accessibility preferences; Valhalla costing_options |
| **User Control** | Per-type notification toggles; Quiet Hours; Text Size with instant apply |
| **Emergency Accessibility** | Crisis Mode always accessible via nav bar |
| **Data Integrity** | Frontend + backend validation; staff-only approve/resolve endpoints |

---

## 9. V1 → V2 → V2.1 → V2.2 → V3.0 Migration Summary

| Aspect | V1 | V2 | V2.1 | V2.2 | V3.0 |
|--------|----|----|------|------|------|
| Data storage | localStorage | SQLite | Same | Same | SQLite (local) / PostgreSQL (prod) |
| Auth | localStorage | JWT | Same | Same | Same + `role` field |
| Frontend style | Desktop | Desktop | Same | Same | iOS native mobile |
| Navigation | Multi-page links | Sidebar | Same | Same | Tab bar (Map / Report / Profile) |
| Alert default status | N/A | ACTIVE | ACTIVE | UNDER REVIEW | PENDING |
| Status flow | N/A | ACTIVE → RESOLVED | Same | UNDER REVIEW → ACTIVE → RESOLVED | PENDING → ACTIVE → RESOLVED |
| Moderation | None | None | None | Any user | Staff only |
| Role system | None | None | None | None | student / staff |
| Report form | N/A | 5 independent forms | Same + validation | Same | 3-step unified flow |
| Alert history | Static | Separate page | Same | Same | Integrated in app shell |
| Building search | None | None | None | None | Building code priority + Nominatim fallback |
| Deployment | Local only | Local only | Same | Same | Hetzner VPS + Coolify + PostgreSQL |
| Seed data | None | 5 alerts on startup | Same | Same | Staff account only (no fake alerts) |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| V1 | 2026-03 | Frontend-only prototype with localStorage |
| V2 | 2026-03-23 | Full-stack migration: FastAPI, JWT, SQLite, all 10 user goals |
| V2.1 | 2026-03-24 | Input validation, elevator form fix, accessible routing, crowdsourced report count |
| V2.2 | 2026-03-26 | Two-stage alert verification (UNDER REVIEW → ACTIVE → RESOLVED) |
| V3.0 | 2026-04-03 | iOS UI rewrite, staff moderation workflow, building code search, VPS deployment, PostgreSQL |

---

*Concordia Emergency V3.0 — Group 9, SOEN 6751, Concordia University*  
*V1 Repository: https://github.com/BunnyPrince/Concordia-Emergency*  
*V2 Repository: https://github.com/linyuhang617/Concordia-Emergency-v2*  
*V3 Repository: https://github.com/linyuhang617/Concordia-Emergency-v3*
