const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// ─────────────────────────────────────────────────────────────
// POST /api/events
// Receive and store a single event (or batch array of events)
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    // Support both single event object and array
    const events = Array.isArray(payload) ? payload : [payload];

    const docs = events.map((e) => ({
      sessionId: e.sessionId,
      eventType: e.eventType,
      pageUrl: e.pageUrl,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      x: e.x ?? null,
      y: e.y ?? null,
      userAgent: e.userAgent || '',
      viewportWidth: e.viewportWidth ?? null,
      viewportHeight: e.viewportHeight ?? null,
    }));

    await Event.insertMany(docs);
    return res.status(201).json({ success: true, inserted: docs.length });
  } catch (err) {
    console.error('POST /events error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/sessions
// List all unique sessions with event counts and metadata
// ─────────────────────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          eventCount: { $sum: 1 },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          pageUrls: { $addToSet: '$pageUrl' },
          clickCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          pageViewCount: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
        },
      },
      { $sort: { lastSeen: -1 } },
    ]);

    const formatted = sessions.map((s) => ({
      sessionId: s._id,
      eventCount: s.eventCount,
      clickCount: s.clickCount,
      pageViewCount: s.pageViewCount,
      firstSeen: s.firstSeen,
      lastSeen: s.lastSeen,
      pageUrls: s.pageUrls,
    }));

    return res.json({ success: true, sessions: formatted });
  } catch (err) {
    console.error('GET /sessions error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/sessions/:sessionId
// Ordered list of all events for a specific session (user journey)
// ─────────────────────────────────────────────────────────────
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    return res.json({ success: true, sessionId, events });
  } catch (err) {
    console.error('GET /sessions/:sessionId error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/heatmap?pageUrl=<url>
// Return all click events for a given page URL
// ─────────────────────────────────────────────────────────────
router.get('/heatmap', async (req, res) => {
  try {
    const { pageUrl } = req.query;
    if (!pageUrl) {
      return res
        .status(400)
        .json({ success: false, error: 'pageUrl query param is required' });
    }

    const clicks = await Event.find({ pageUrl, eventType: 'click' })
      .select('x y timestamp sessionId viewportWidth viewportHeight -_id')
      .lean();

    // Also return the list of all unique pages for the dropdown
    const allPages = await Event.distinct('pageUrl');

    return res.json({ success: true, pageUrl, clicks, allPages });
  } catch (err) {
    console.error('GET /heatmap error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/pages
// Return distinct pageUrls (for heatmap dropdown)
// ─────────────────────────────────────────────────────────────
router.get('/pages', async (req, res) => {
  try {
    const pages = await Event.distinct('pageUrl');
    return res.json({ success: true, pages });
  } catch (err) {
    console.error('GET /pages error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
