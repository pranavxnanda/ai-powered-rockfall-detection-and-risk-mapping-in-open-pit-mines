# RFD — AI-Powered Rockfall Detection System

A full-stack web application for real-time rockfall monitoring, risk assessment, and incident management. The system combines IoT sensor data, an ML hazard detection model, and a Gemini-powered AI assistant to help planners and miners respond to geological risks.

---

## Project Structure

```
RFD-cc/
├── rockfall-backend/      # Node.js + Express REST API
└── rockfall-frontend/     # React + Vite SPA
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Auth | JWT + bcryptjs |
| SQL DB | MySQL via Sequelize (user management) |
| NoSQL DB | MongoDB via Mongoose (operational data) |
| Cache / Pub-Sub | Redis via ioredis |
| Real-time | Socket.IO |
| AI Assistant | Google Gemini (`@google/generative-ai`) |
| ML Integration | External ML model API (polled every 30s) |
| PDF Reports | PDFKit |
| Security | Helmet, CORS, express-rate-limit |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| State | Redux Toolkit |
| Routing | React Router v7 |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet |
| 3D Viewer | Three.js + React Three Fiber + Drei |
| Real-time | Socket.IO Client |
| HTTP | Axios |

---

## Prerequisites

- Node.js >= 18
- MySQL (port 3307 by default)
- MongoDB (port 27017)
- Redis (port 6379)
- An external ML model API endpoint
- A Google Gemini API key

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/...` | Register, login, logout |
| GET/POST | `/api/users` | User management |
| GET/POST | `/api/zones` | Risk zone management |
| GET/POST | `/api/risks` | Risk assessments |
| GET/POST | `/api/alerts` | Alert management |
| GET/POST | `/api/incidents` | Incident reporting |
| GET/POST | `/api/sensors` | Sensor data |
| GET/POST | `/api/work-assignments` | Work assignments |
| POST | `/api/assistant` | AI assistant (Gemini) |
| GET | `/api/ml-model` | ML hazard detection |
| GET | `/api/reports` | PDF report generation |
| GET | `/api/health` | System health check |

---

## User Roles

The system supports three roles with separate dashboards:

- **Admin** — full system access, user management, sensor management, system health
- **Planner** — dashboard overview, work assignments, report generation
- **Miner** — field-facing alerts, incident reporting, personal dashboard

---

## Features

- Real-time sensor monitoring with WebSocket updates
- ML-powered hazard detection (polled from external model API)
- AI assistant powered by Google Gemini for contextual guidance
- Interactive risk zone map (Leaflet)
- 3D terrain model viewer (Three.js / `.glb` model)
- Role-based access control
- PDF report generation
- System health monitoring dashboard

---

## Environment Variables Reference

See `.env.example` in the `rockfall-backend/` directory for all required variables and their descriptions.

---

## Notes

- The `public/models/pitmin.glb` file (~52MB) is excluded from version control. Host it separately (CDN, object storage, or Git LFS) and update the path in the frontend accordingly.
- Redis is optional — the server will start without it but caching and pub-sub features will be unavailable.
- The ML model polling URL (`ML_MODEL_API_URL`) must point to a running inference server.
