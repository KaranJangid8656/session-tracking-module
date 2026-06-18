'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Event {
  _id: string;
  sessionId: string;
  eventType: 'page_view' | 'click';
  pageUrl: string;
  timestamp: string;
  x: number | null;
  y: number | null;
  userAgent: string;
  viewportWidth: number | null;
  viewportHeight: number | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}
function timeSince(prev: string | null, curr: string) {
  if (!prev) return null;
  const ms = new Date(curr).getTime() - new Date(prev).getTime();
  if (ms < 1000) return `+${ms}ms`;
  if (ms < 60000) return `+${(ms / 1000).toFixed(1)}s`;
  return `+${(ms / 60000).toFixed(1)}m`;
}

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const sessionId = decodeURIComponent(params.id);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/sessions/${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEvents(d.events);
        else setError(d.error || 'Failed to load events');
      })
      .catch(() => setError('Cannot reach the backend. Is it running on port 4000?'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const clickCount = events.filter((e) => e.eventType === 'click').length;
  const pageViewCount = events.filter((e) => e.eventType === 'page_view').length;
  const firstEvent = events[0] ?? null;
  const lastEvent  = events[events.length - 1] ?? null;

  return (
    <main className="page-wrapper">
      <button className="back-btn" onClick={() => router.push('/')}>
        ← Back to Sessions
      </button>

      {/* Session header card */}
      {!loading && !error && firstEvent && (
        <div className="session-header fade-up">
          <div>
            <div className="session-id-label">Session ID</div>
            <div className="session-id-value">{sessionId}</div>
          </div>
          <div className="session-meta-grid">
            <div className="session-meta-item">
              <div className="session-meta-label">Events</div>
              <div className="session-meta-value">{events.length}</div>
            </div>
            <div className="session-meta-item">
              <div className="session-meta-label">Page Views</div>
              <div className="session-meta-value" style={{ color: 'var(--green)' }}>{pageViewCount}</div>
            </div>
            <div className="session-meta-item">
              <div className="session-meta-label">Clicks</div>
              <div className="session-meta-value" style={{ color: 'var(--pink)' }}>{clickCount}</div>
            </div>
            <div className="session-meta-item">
              <div className="session-meta-label">Date</div>
              <div className="session-meta-value">{formatDate(firstEvent.timestamp)}</div>
            </div>
            <div className="session-meta-item">
              <div className="session-meta-label">Start</div>
              <div className="session-meta-value">{formatTime(firstEvent.timestamp)}</div>
            </div>
            {lastEvent && (
              <div className="session-meta-item">
                <div className="session-meta-label">End</div>
                <div className="session-meta-value">{formatTime(lastEvent.timestamp)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="page-header fade-up stagger-1" style={{ marginBottom: '1.5rem' }}>
        <h2>User Journey</h2>
        <p>Ordered list of all interactions during this session.</p>
      </div>

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading events…</span>
        </div>
      )}
      {error && <div className="error-box">⚠️ {error}</div>}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No events found</div>
          <div className="empty-desc">This session has no recorded events.</div>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="timeline fade-up stagger-2">
          {events.map((ev, i) => {
            const delta = timeSince(events[i - 1]?.timestamp ?? null, ev.timestamp);
            return (
              <div className="timeline-item" key={ev._id}>
                <div className={`timeline-dot ${ev.eventType}`} />
                <div className="timeline-card">
                  <div className="timeline-meta">
                    <span
                      className={`badge ${ev.eventType === 'page_view' ? 'badge-blue' : 'badge-pink'}`}
                    >
                      {ev.eventType === 'page_view' ? '📄 page_view' : '🖱️ click'}
                    </span>
                    <span className="timeline-time">{formatTime(ev.timestamp)}</span>
                    {delta && (
                      <span style={{ fontSize: '.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        {delta}
                      </span>
                    )}
                    <span
                      style={{ marginLeft: 'auto', fontSize: '.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}
                    >
                      #{i + 1}
                    </span>
                  </div>
                  <div className="timeline-url">🔗 {ev.pageUrl}</div>
                  {ev.eventType === 'click' && ev.x !== null && ev.y !== null && (
                    <div className="timeline-coords">
                      📍 x: {ev.x}px, y: {ev.y}px
                      {ev.viewportWidth && ev.viewportHeight && (
                        <span style={{ color: 'var(--muted)' }}>
                          {' '}(viewport {ev.viewportWidth}×{ev.viewportHeight})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
