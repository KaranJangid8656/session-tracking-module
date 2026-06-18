/**
 * CausalFunnel Analytics Tracker
 * Drop this script onto any page to auto-track page_view and click events.
 *
 * Config (set before loading this script):
 *   window.CF_CONFIG = {
 *     apiUrl: 'http://localhost:4000/api/events',  // backend endpoint
 *     batchInterval: 2000,   // ms between batch flushes
 *   };
 */
(function (window, document) {
  'use strict';

  // ── Config ──────────────────────────────────────────────────
  const config = Object.assign(
    {
      apiUrl: 'http://localhost:4000/api/events',
      batchInterval: 2000,
    },
    window.CF_CONFIG || {}
  );

  // ── Session ID ───────────────────────────────────────────────
  function getOrCreateSessionId() {
    const KEY = 'cf_session_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        'sess_' +
        Date.now().toString(36) +
        '_' +
        Math.random().toString(36).slice(2, 9);
      localStorage.setItem(KEY, id);
    }
    return id;
  }

  const sessionId = getOrCreateSessionId();

  // ── Event queue & flush ──────────────────────────────────────
  const queue = [];

  function flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    const payload = JSON.stringify(batch);

    // Use sendBeacon when available (non-blocking, survives page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(config.apiUrl, blob);
    } else {
      fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function (err) {
        console.warn('[CF Tracker] Failed to send events:', err);
      });
    }
  }

  // Periodic flush
  setInterval(flush, config.batchInterval);

  // Flush on page unload
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });

  // ── Core tracking function ────────────────────────────────────
  function track(eventType, extras) {
    const event = Object.assign(
      {
        sessionId: sessionId,
        eventType: eventType,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
      extras || {}
    );
    queue.push(event);
  }

  // ── Auto-track page_view ──────────────────────────────────────
  track('page_view');

  // ── Auto-track clicks ─────────────────────────────────────────
  document.addEventListener(
    'click',
    function (e) {
      track('click', {
        x: e.clientX,
        y: e.clientY,
        // Normalised coordinates (0–1) relative to viewport for responsiveness
        xRatio: parseFloat((e.clientX / window.innerWidth).toFixed(4)),
        yRatio: parseFloat((e.clientY / window.innerHeight).toFixed(4)),
        targetTag: e.target ? e.target.tagName.toLowerCase() : '',
        targetId: e.target ? e.target.id || '' : '',
      });
    },
    true // capture phase so we get all clicks
  );

  // ── SPA route change support ──────────────────────────────────
  // Patch pushState / replaceState to fire page_view on navigation
  (function patchHistory() {
    var orig = window.history.pushState;
    window.history.pushState = function () {
      orig.apply(this, arguments);
      track('page_view');
    };
    window.addEventListener('popstate', function () {
      track('page_view');
    });
  })();

  // ── Public API ────────────────────────────────────────────────
  window.CausalFunnel = {
    track: track,
    flush: flush,
    sessionId: sessionId,
  };

  console.log(
    '%c[CausalFunnel Tracker] Initialised — session: ' + sessionId,
    'color:#6366f1;font-weight:bold;'
  );
})(window, document);
