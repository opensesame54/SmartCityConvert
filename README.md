# Smart City Incident Reporting System

A MERN-based civic incident management platform. Citizens report infrastructure problems, the system routes them to the responsible municipal department, workers resolve them, and administrators oversee the entire pipeline. The application supports real-time status updates over Socket.IO and automatic escalation of overdue incidents via a background queue.

**Live deployment:** https://smartcity-vxqp.onrender.com

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Application Modules](#application-modules)
- [Database Schema](#database-schema)
- [Real-Time System](#real-time-system)
- [Background Scheduling](#background-scheduling)
- [Role-Based Access Control](#role-based-access-control)
- [Incident Lifecycle](#incident-lifecycle)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Data Seeding and Migration](#data-seeding-and-migration)

---

## Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │            Browser Client            │
                        │   React UI + Axios + Socket.IO       │
                        └────────────┬──────────┬─────────────┘
                                     │          │
                            HTTP     │          │  Socket.IO
                                     │          │
                        ┌────────────▼──────────▼─────────────┐
                        │        Node.js / Express API         │
                        │     REST + JWT auth + uploads        │
                        └────────────┬──────────┬─────────────┘
                                     │          │
                               MongoDB          │   Redis
                                     │          │
                        ┌────────────▼──┐   ┌───▼─────────────┐
                        │  Mongo Atlas  │   │ Socket.IO + Bull │
                        │   (Mongoose)  │   │  (pub/sub, jobs) │
                        └───────────────┘   └─────────────────┘
```

```
Real-Time Broadcast Flow
─────────────────────────

  Admin / Worker updates status
       │
       ▼
  Express controller updates Incident
       │
       ▼
  Socket.IO emit: incident.update
       │
       ▼
     Redis adapter → all connected browsers
```

```
Auto-Escalation Flow
─────────────────────

  Bull queue (repeatable job)
       │
       ▼
  escalationQueue processor
       │
       ├── Query: deadline < now, status NOT IN [RESOLVED, ESCALATED]
       ├── Update status → ESCALATED, priority → EMERGENCY
       └── Socket.IO broadcast to browsers
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React (CRA) | SPA UI, routing, state management |
| API | Node.js + Express | REST endpoints, JWT auth, file uploads |
| Database | MongoDB Atlas | Primary data store |
| ODM | Mongoose | Schema modeling and validation |
| Real-Time | Socket.IO + Redis adapter | Live status updates across instances |
| Queue | Bull + Redis | Escalation jobs and async tasks |
| Maps | Leaflet + OpenStreetMap | Interactive incident maps |
| Charts | Chart.js | Analytics dashboards |
| UI | Bootstrap 5 | Layout and components |
| Deployment | Render | Web hosting and environment management |

---

## Project Structure

```
SmartCityConvert/
├── README.md
├── .gitignore
├── client/                     # React app
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
│
└── server/                     # Express API
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── jobs/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── scripts/
    │   ├── services/
    │   ├── socket/
    │   └── app.js
    ├── .env
    └── package.json
```

---

## Application Modules

### `client/` — React UI

- `src/pages/Dashboard.js` renders the live incident map and sidebar filters.
- `src/pages/AdminPanel.js` provides a kanban board with drag-and-drop status updates.
- `src/pages/WorkerPanel.js` focuses on assigned incidents for workers.
- `src/pages/Analytics.js` renders charts and a heatmap using `react-leaflet` and Chart.js.
- `src/context/AuthContext.js` manages JWT auth state in local storage.
- `src/api/client.js` is the Axios client with JWT injection.

### `server/` — Express API

- `src/controllers/` contains feature controllers for auth, incidents, analytics, and departments.
- `src/routes/` defines REST routes and connects them to controllers.
- `src/socket/` sets up Socket.IO and Redis adapter for multi-instance broadcasts.
- `src/jobs/escalationQueue.js` defines the escalation processor and schedule.
- `src/services/incidentService.js` contains shared routing and deadline helpers.
- `src/scripts/` contains one-off scripts for seeding and data migration.

---

## Database Schema

MongoDB collections are modeled with Mongoose in `server/src/models`.

```
users
─────────────────────────────────────────────────
_id            ObjectId
username       String
email          String
passwordHash   String
role           citizen | admin | worker
department     ObjectId (ref: departments)
createdAt      Date
updatedAt      Date

departments
─────────────────────────────────────────────────
_id            ObjectId
name           String
code           PUBLIC_WORKS | SANITATION | ELECTRICITY | WATER | TRAFFIC
email          String
phone          String
description    String

incidents
─────────────────────────────────────────────────
_id            ObjectId
trackingId     String (INC-XXXXXXXX)
title          String
description    String
incidentType   POTHOLE | GARBAGE | STREETLIGHT | WATER_LEAK | TRAFFIC | MISC
status         SUBMITTED | ASSIGNED | IN_PROGRESS | RESOLVED | ESCALATED
priority       LOW | MEDIUM | HIGH | EMERGENCY
latitude       Number
longitude      Number
address        String
area           String
imageUrl       String
reportedBy     ObjectId (ref: users)
assignedTo     ObjectId (ref: users)
department     ObjectId (ref: departments)
deadline       Date
resolvedAt     Date
createdAt      Date
updatedAt      Date

status_updates
─────────────────────────────────────────────────
_id            ObjectId
incident       ObjectId (ref: incidents)
status         String
note           String
updatedBy      ObjectId (ref: users)
timestamp      Date
```

**Automatic logic in `incidentService`:**

1. Generates `trackingId` if missing.
2. Routes incidents to a department based on `incidentType`.
3. Calculates `deadline` from `priority`.
4. Auto-assigns EMERGENCY incidents to an available worker.

---

## Real-Time System

Socket.IO broadcasts incident updates to all connected clients.

### Components

- `server/src/socket/index.js` creates the Socket.IO server and Redis adapter.
- Controllers emit `incident.update` events after status changes.
- `client/src/hooks/useSocket.js` listens and updates the UI with toasts.

### Message Payload

```json
{
  "incident_id": "64f1...",
  "tracking_id": "INC-A3F8B2C1",
  "title": "Broken streetlight on MG Road",
  "status": "IN_PROGRESS",
  "status_display": "In Progress",
  "note": "Crew dispatched",
  "updated_by": "worker_ravi",
  "timestamp": "2026-04-08T14:30:00+05:30"
}
```

---

## Background Scheduling

Escalations run through Bull on a repeatable job:

- `server/src/jobs/escalationQueue.js` scans overdue incidents.
- Overdue incidents are escalated and broadcast via Socket.IO.

---

## Role-Based Access Control

| Action | Citizen | Worker | Admin |
|---|---|---|---|
| View public dashboard | Yes | Yes | Yes |
| Report an incident | Yes | No | No |
| View own incidents | Yes | — | — |
| View assigned incidents | — | Yes | — |
| View all incidents | No | No | Yes |
| Update incident status | No | Yes (assigned only) | Yes |
| Access admin panel | No | No | Yes |
| Access worker panel | No | Yes | No |
| View analytics | No | Yes | Yes |

Access control is enforced in Express middleware and route guards. The UI also hides routes based on user role.

---

## Incident Lifecycle

```
  Citizen submits report
          │
          ▼
     [SUBMITTED]
          │
          │  Admin assigns to department/worker
          ▼
     [ASSIGNED]
          │
          │  Worker begins work
          ▼
    [IN_PROGRESS]
          │
          ├──────────────────────────────┐
          │                              │
          │  Worker marks complete       │  Deadline exceeded (queue)
          ▼                              ▼
     [RESOLVED]                    [ESCALATED]
```

Every transition creates a `StatusUpdate` entry for audit history.

---

## API Endpoints

Base URL: `/api`

### Auth

| Method | URL | Description |
|---|---|---|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login and return JWT |
| POST | `/auth/logout` | Logout (client-side token removal) |

### Incidents

| Method | URL | Description |
|---|---|
| GET | `/incidents` | List incidents with filters |
| POST | `/incidents` | Create incident |
| GET | `/incidents/:id` | Incident detail |
| POST | `/incidents/:id/status` | Update status |

### Analytics / Departments

| Method | URL | Description |
|---|---|
| GET | `/analytics` | Dashboard analytics data |
| GET | `/departments` | List departments |

### `GET /incidents` Query Parameters

| Parameter | Values | Description |
|---|---|---|
| `status` | `SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED` | Filter by status |
| `type` | `POTHOLE`, `GARBAGE`, `STREETLIGHT`, `WATER_LEAK`, `TRAFFIC`, `MISC` | Filter by incident type |
| `area` | string | Case-insensitive substring match on area field |
| `q` | string | Search across title, tracking ID, and area |
| `mine` | `true` | Only incidents reported by the current user |
| `assigned` | `true` | Only incidents assigned to the current user |
| `scope` | `all` | Admin: return all incidents |

---

## Deployment

- **Client:** static React build served by Render.
- **Server:** Node.js API with Socket.IO.
- **Database:** MongoDB Atlas.
- **Redis:** required for Socket.IO adapter and Bull queue.

---

## Local Development Setup

**Prerequisites:** Node.js 18+, MongoDB Atlas connection string, Redis.

```bash
git clone <repository-url>
cd SmartCityConvert
```

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

```bash
cd client
npm install
npm start
```

---

## Environment Variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | API port (default 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing key |
| `JWT_EXPIRES_IN` | No | Token TTL (e.g. `7d`) |
| `CLIENT_ORIGIN` | Yes | React app origin (CORS) |
| `REDIS_URL` | Yes | Redis connection string |

### `client/.env`

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | No | API base URL (defaults to `http://localhost:5000/api`) |

---

## Data Seeding and Migration

- `server/src/scripts/seedDepartments.js` seeds default departments.
- `server/src/scripts/migratePostgres.js` migrates legacy Postgres data into MongoDB.

Run scripts from the `server/` directory with Node:

```bash
node src/scripts/seedDepartments.js
node src/scripts/migratePostgres.js
```
