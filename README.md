# CausalFunnel Analytics — Full-Stack Assignment

A full-stack user analytics application that tracks user interactions on a webpage and displays them in a real-time dashboard.

---

## ✨ Features

- **Event Tracking** — JavaScript snippet auto-tracks `page_view` and `click` events with session IDs, timestamps, and coordinates
- **Backend API** — Node.js/Express REST API backed by MongoDB
- **Sessions Dashboard** — Live list of all sessions with event counts, searchable and clickable
- **Session Journey** — Ordered timeline of every event within a session with time deltas
- **Click Heatmap** — Canvas-based density heatmap with hot/warm/cool colour gradient per page URL

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Tracking Script | Vanilla JavaScript (IIFE, sendBeacon) |
| Backend | Node.js 18+ · Express 4 · Mongoose 8 |
| Database | MongoDB 6+ |
| Dashboard | Next.js 14 (App Router) · TypeScript · Vanilla CSS |

---

## 📁 Project Structure

```
CausalFunnel-Assignment/
├── backend/              # Express API server
│   ├── src/
│   │   ├── models/Event.js    # Mongoose schema
│   │   ├── routes/events.js   # All API routes
│   │   └── index.js           # Server entry point
│   ├── .env              # Local env (git-ignored)
│   ├── .env.example      # Template
│   └── package.json
│
├── frontend/             # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx           # Sessions list view
│   │   ├── sessions/[id]/     # Session journey view
│   │   └── heatmap/           # Click heatmap view
│   ├── components/
│   │   └── Navbar.tsx
│   ├── .env.local
│   └── package.json
│
├── demo-page/            # Test webpage with tracker
│   ├── index.html         # ShopNova demo e-commerce page
│   └── tracker.js         # Tracking snippet
│
└── README.md
```

---

## 🚀 Setup & Running

### Prerequisites

- **Node.js** v18 or later
- **MongoDB** running locally on default port `27017`
  - Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
  - Start `mongod` before running the backend
- Optional: **MongoDB Compass** or **MongoDB for VS Code**
  - Use the local connection string `mongodb://localhost:27017`
  - Connect to the `causalfunnel` database and open the `events` collection

---

### 1 · Start the Backend

```bash
cd backend
npm install          # first time only
npm run dev          # starts on http://localhost:4000
```

Verify: `http://localhost:4000/health` should return `{"status":"ok"}`.

---

### 2 · Start the Dashboard

```bash
cd frontend
npm install          # first time only
npm run dev          # starts on http://localhost:3000
```

Open: `http://localhost:3000`

---

### 3 · Open the Demo Page

Simply open `demo-page/index.html` in your browser (double-click or `File → Open`).

Click around, scroll, add items to cart. Events are automatically sent to the backend every 1.5 seconds.

Then refresh the dashboard to see your session appear!

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Receive one or a batch of events |
| `GET` | `/api/sessions` | List all sessions with event counts |
| `GET` | `/api/sessions/:sessionId` | Ordered events for a session |
| `GET` | `/api/heatmap?pageUrl=…` | Click coordinates for a page |
| `GET` | `/api/pages` | All distinct tracked page URLs |
| `GET` | `/health` | Health check |

### Event Payload

```json
{
  "sessionId": "sess_lz8abc_xyz123",
  "eventType": "click",
  "pageUrl": "http://localhost/demo-page/index.html",
  "timestamp": "2025-06-18T08:00:00.000Z",
  "x": 342,
  "y": 218,
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "userAgent": "Mozilla/5.0 …"
}
```

---

## 🔌 Local MongoDB Setup

1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start the local MongoDB server (`mongod`)
3. Edit `backend/.env` if needed:
   ```
   MONGO_URI=mongodb://localhost:27017/causalfunnel
   ```
4. Connect using MongoDB Compass or MongoDB for VS Code with:
   ```
   mongodb://localhost:27017
   ```
5. Open the `causalfunnel` database and inspect the `events` collection.

---

## 🎨 Design Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| **Batched events** | Tracker queues events and flushes every 1.5s via `sendBeacon` to avoid blocking clicks with network calls |
| **`localStorage` session ID** | Simple and persistent across tabs; a cookie alternative is trivial to add |
| **Canvas heatmap** | Pure canvas gives full control over density rendering without a heavy library |
| **Normalised coords** | Storing both raw `x/y` and `xRatio/yRatio` allows the heatmap to scale to any viewport |
| **Next.js App Router** | Colocated data fetching per route; no global state library needed for this scope |
| **Vanilla CSS** | Avoids Tailwind bloat; custom design system is more maintainable for a focused dashboard |
| **No auth** | Out of scope for this assignment; would add JWT middleware to the API in production |

---

## 🧪 Quick Test with curl

```bash
# Send a page_view event
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test_session","eventType":"page_view","pageUrl":"http://example.com","timestamp":"2025-06-18T08:00:00Z"}'

# Send a click event
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test_session","eventType":"click","pageUrl":"http://example.com","timestamp":"2025-06-18T08:00:05Z","x":200,"y":400}'

# Get all sessions
curl http://localhost:4000/api/sessions

# Get heatmap data
curl "http://localhost:4000/api/heatmap?pageUrl=http://example.com"
```
