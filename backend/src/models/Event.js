const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['page_view', 'click'],
    },
    pageUrl: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Click coordinates (only for 'click' events)
    x: {
      type: Number,
      default: null,
    },
    y: {
      type: Number,
      default: null,
    },
    // Optional metadata
    userAgent: {
      type: String,
      default: '',
    },
    viewportWidth: {
      type: Number,
      default: null,
    },
    viewportHeight: {
      type: Number,
      default: null,
    },
  },
  {
    collection: 'events',
  }
);

// Compound index for heatmap queries
eventSchema.index({ pageUrl: 1, eventType: 1 });

module.exports = mongoose.model('Event', eventSchema);
