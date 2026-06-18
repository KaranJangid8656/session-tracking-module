'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Session {
  sessionId: string;
  eventCount: number;
  clickCount: number;
  pageViewCount: number;
  firstSeen: string;
  lastSeen: string;
  pageUrls: string[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function duration(first: string, last: string) {
  const ms = new Date(last).getTime() - new Date(first).getTime();
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/sessions`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSessions(d.sessions);
        else setError(d.error || 'Failed to load sessions');
      })
      .catch(() => setError('Cannot reach the backend. Is it running on port 4000?'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(search.toLowerCase())
  );

  const totalEvents = sessions.reduce((a, s) => a + s.eventCount, 0);
  const totalClicks = sessions.reduce((a, s) => a + s.clickCount, 0);
  const totalViews  = sessions.reduce((a, s) => a + s.pageViewCount, 0);

  return (
    <main className="page-wrapper">
      {/* Header */}
      <div className="page-header fade-up">
        <h1>User Sessions</h1>
        <p>Every tracked session and their interaction events, most recent first.</p>
      </div>

      {/* Stat cards */}
      {!loading && !error && (
        <div className="stats-row fade-up stagger-1">
          <div className="stat-card">
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value accent">{sessions.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{totalEvents}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Page Views</div>
            <div className="stat-value green">{totalViews}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Clicks</div>
            <div className="stat-value pink">{totalClicks}</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading sessions…</span>
        </div>
      )}

      {/* Error */}
      {error && <div className="error-box">⚠️ {error}</div>}

      {/* Table */}
      {!loading && !error && (
        <div className="table-container fade-up stagger-2">
          <div className="table-header">
            <span className="table-title">Sessions</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Search session ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  padding: '.4rem .8rem',
                  fontSize: '.85rem',
                  outline: 'none',
                  width: '200px',
                }}
              />
              <span className="table-count">{filtered.length} sessions</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No sessions yet</div>
              <div className="empty-desc">
                Open the demo page and interact with it to start generating events.
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Events</th>
                  <th>Page Views</th>
                  <th>Clicks</th>
                  <th>Duration</th>
                  <th>First Seen</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.sessionId}
                    onClick={() => router.push(`/sessions/${encodeURIComponent(s.sessionId)}`)}
                    title="Click to view session journey"
                  >
                    <td className="td-session">{s.sessionId}</td>
                    <td>
                      <span className="badge badge-blue">{s.eventCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-green">{s.pageViewCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-pink">{s.clickCount}</span>
                    </td>
                    <td className="td-muted">{duration(s.firstSeen, s.lastSeen)}</td>
                    <td className="td-muted">{formatDate(s.firstSeen)}</td>
                    <td className="td-muted">{formatDate(s.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}
