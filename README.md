# Session Tracker

A lightweight session tracker that captures user events from a demo page, stores them in MongoDB, and displays session analytics in a Next.js dashboard.

## Overview

This repository contains a simple Open Web analytics workflow:

- A demo page that emits `page_view` and `click` events
- A backend API that stores those events in MongoDB
- A dashboard that displays session summaries and event timelines

## Repo layout

```
session-tracker/
├── backend/
│   ├── src/
│   │   ├── index.js        # Express app entry point
│   │   ├── models/Event.js # MongoDB event schema
│   │   └── routes/events.js# API routes
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx        # Home session dashboard
│   │   └── sessions/[id]/  # Session detail page
│   ├── components/
│   │   └── Navbar.tsx
│   ├── globals.css
│   └── package.json
├── demo-page/
│   ├── index.html         # Sample page with tracking script
│   └── tracker.js         # Event capture logic
└── README.md
```

## Quick start

### 1. Start MongoDB

Run a local MongoDB instance and verify it is available on:

```
mongodb://localhost:27017
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

The server runs at `http://localhost:4000`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs at `http://localhost:3000`.

### 4. Use the demo page

Open `demo-page/index.html` in your browser.
Interact with the page and events will be sent to the backend automatically. Then refresh the dashboard to see session data.

## What is included

- `frontend`: Next.js app showing session summaries and session detail views
- `backend`: Express API storing event data in MongoDB
- `demo-page`: Static page with tracking code that generates session events

## Features

- Event tracking for `page_view` and `click`
- Session aggregation by `sessionId`
- Session list with search and counts
- Session detail view showing ordered events
- Click coordinates stored for future visualization

## API endpoints

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/events` | Store one or more event objects |
| `GET` | `/api/sessions` | Get session summary list |
| `GET` | `/api/sessions/:sessionId` | Get ordered events for a session |
| `GET` | `/health` | Check service status |

## Example event payload

```json
{
  "sessionId": "sess_123abc",
  "eventType": "click",
  "pageUrl": "http://localhost/demo-page/index.html",
  "timestamp": "2026-06-19T10:00:00.000Z",
  "x": 320,
  "y": 240,
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "userAgent": "Mozilla/5.0 ..."
}
```

## Local MongoDB setup

1. Install MongoDB Community Edition: https://www.mongodb.com/try/download/community
2. Start the MongoDB daemon (`mongod`)
3. Confirm that `mongodb://localhost:27017` is reachable
4. Use `MongoDB Compass` or `MongoDB for VS Code` to inspect the `causalfunnel` database

## Notes

- The frontend dashboard uses Next.js App Router and TypeScript.
- The backend is a simple Express app with Mongoose.
- The demo page is intentionally minimal for tracking and testing.
- Click events are captured with coordinates so the dataset is ready for heatmap visualization.

## Helpful commands

```bash
# start backend
cd backend && npm install && npm run dev

# start frontend
cd frontend && npm install && npm run dev

# health check
curl http://localhost:4000/health

# test event post
curl -X POST http://localhost:4000/api/events \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test_session","eventType":"page_view","pageUrl":"http://localhost/demo-page/index.html","timestamp":"2026-06-19T10:00:00Z"}'
```
