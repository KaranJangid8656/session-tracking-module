require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/causalfunnel';

// ── Middleware ────────────────────────────────────────────────
app.use(
  cors({
    origin: '*', // Allow all origins in dev (demo page is file://)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '1mb' }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────
// Events: POST /api/events
// Sessions: GET /api/sessions, GET /api/sessions/:id
// Heatmap: GET /api/heatmap?pageUrl=...
// Pages: GET /api/pages
app.use('/api', eventsRouter);

// ── Connect to MongoDB then start server ──────────────────────
async function start() {
  try {
    console.log(`⏳  Connecting to MongoDB at ${MONGO_URI} …`);
    await mongoose.connect(MONGO_URI);
    console.log('✅  MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀  Backend running at http://localhost:${PORT}`);
      console.log(`    Health: http://localhost:${PORT}/health`);
      console.log(`    Events: POST http://localhost:${PORT}/api/events`);
      console.log(`    Sessions: GET http://localhost:${PORT}/api/sessions`);
      console.log(`    Heatmap: GET http://localhost:${PORT}/api/heatmap?pageUrl=...`);
    });
  } catch (err) {
    console.error('❌  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
