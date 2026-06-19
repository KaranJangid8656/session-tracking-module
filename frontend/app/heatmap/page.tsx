"use client";
import React, { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function HeatmapPage() {
  const [pageUrl, setPageUrl] = useState('http://localhost/demo');
  const [clicks, setClicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // fetch default on mount
    fetchHeatmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHeatmap() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`);
      const d = await res.json();
      if (d.success) setClicks(d.clicks || []);
      else setError(d.error || 'Failed to load heatmap');
    } catch (err) {
      setError('Cannot reach backend. Is it running on port 4000?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Heatmap</h1>
      <p>Enter a page URL to retrieve click coordinates collected by the tracker.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} style={{ flex: 1, padding: 8 }} />
        <button onClick={fetchHeatmap} style={{ padding: '8px 12px' }}>Fetch</button>
      </div>

      {loading && <div>Loading heatmap…</div>}
      {error && <div style={{ color: 'crimson' }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div>
          <div style={{ marginBottom: 8 }}>Clicks found: <strong>{clicks.length}</strong></div>
          {clicks.length === 0 && <div>No click events yet for this page.</div>}
          {clicks.length > 0 && (
            <ol>
              {clicks.map((c, i) => (
                <li key={i}>x: {c.x}, y: {c.y} — viewport {c.viewportWidth}×{c.viewportHeight} — {new Date(c.timestamp).toLocaleString()}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </main>
  );
}
