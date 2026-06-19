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
  const totalViews = sessions.reduce((a, s) => a + s.pageViewCount, 0);
  const uniquePages = new Set(sessions.flatMap((s) => s.pageUrls)).size;
  const avgDuration = sessions.length
    ? Math.round(
        sessions.reduce((sum, s) => {
          const diff = new Date(s.lastSeen).getTime() - new Date(s.firstSeen).getTime();
          return sum + diff;
        }, 0) / sessions.length / 1000
      )
    : 0;

  return (
    <main className="page-wrapper">
      <section className="page-header">
        <h1>Sessions</h1>
        <p>Browse and inspect the session data captured by the tracker.</p>
      </section>

      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Sessions tracked</div>
          <div className="stat-value accent">{loading ? '…' : sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Page views</div>
          <div className="stat-value green">{loading ? '…' : totalViews}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clicks captured</div>
          <div className="stat-value pink">{loading ? '…' : totalClicks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pages tracked</div>
          <div className="stat-value amber">{loading ? '…' : uniquePages}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg session</div>
          <div className="stat-value cyan">{loading ? '…' : `${avgDuration}s`}</div>
        </div>
      </section>

      <section className="feature-band">
        <div className="section-header">
          <div>
            <h2>Heatmap & analytics</h2>
            <p>Session analytics and heatmap readiness are visible here.</p>
          </div>
        </div>

        <div className="feature-cards">
          <div className="feature-card">
            <h3>Heatmap status</h3>
            <p>
              {loading
                ? 'Loading click data…'
                : totalClicks > 0
                ? 'Heatmap data is available from tracked clicks.'
                : 'No clicks captured yet for heatmap rendering.'}
            </p>
          </div>
          <div className="feature-card">
            <h3>Session analytics</h3>
            <p>Review total sessions, page views, clicks, and average session length instantly.</p>
          </div>
          <div className="feature-card">
            <h3>Ready for visualization</h3>
            <p>Heatmap-ready click events are collected automatically from each session.</p>
          </div>
        </div>
      </section>

      <section className="table-section">
        <div className="section-header">
          <div>
            <h2>Recent session activity</h2>
            <p>Browse the latest captured sessions.</p>
          </div>
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="spinner" />
            <span>Loading sessions…</span>
          </div>
        )}

        {error && <div className="error-box">⚠️ {error}</div>}

        {!loading && !error && (
          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Sessions</span>
              <div className="search-row">
                <input
                  type="text"
                  placeholder="Search session ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="table-count">{filtered.length} sessions</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No sessions yet</div>
                <div className="empty-desc">
                  No session data has been captured yet.
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
      </section>
    </main>
  );
}
