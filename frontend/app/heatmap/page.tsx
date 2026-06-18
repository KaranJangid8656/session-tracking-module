'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ClickPoint {
  x: number;
  y: number;
  viewportWidth: number | null;
  viewportHeight: number | null;
  timestamp: string;
  sessionId: string;
}

function drawHeatmap(
  canvas: HTMLCanvasElement,
  clicks: ClickPoint[],
  referenceViewport: { w: number; h: number }
) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);

  // Dark background mimicking a webpage
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, W, H);

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  if (clicks.length === 0) return;

  // Map click coords to canvas space
  const mapped = clicks.map((c) => ({
    cx: (c.x / (c.viewportWidth || referenceViewport.w)) * W,
    cy: (c.y / (c.viewportHeight || referenceViewport.h)) * H,
  }));

  // Density map for colour scaling
  const RADIUS = 50;
  const densityMap = new Float32Array(mapped.length);
  let maxDensity = 1;
  mapped.forEach((a, i) => {
    mapped.forEach((b, j) => {
      if (i === j) return;
      const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
      if (d < RADIUS) densityMap[i] += 1 - d / RADIUS;
    });
    if (densityMap[i] > maxDensity) maxDensity = densityMap[i];
  });

  // Draw radial gradient blobs
  mapped.forEach((pt, i) => {
    const intensity = densityMap[i] / maxDensity; // 0–1
    const r = 18 + intensity * 24;
    const alpha = 0.2 + intensity * 0.5;
    const grad = ctx.createRadialGradient(pt.cx, pt.cy, 0, pt.cx, pt.cy, r);
    // Hot colour = pink/red, cool = indigo/blue
    if (intensity > 0.6) {
      grad.addColorStop(0, `rgba(236,72,153,${alpha})`);
      grad.addColorStop(0.5, `rgba(239,68,68,${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
    } else if (intensity > 0.3) {
      grad.addColorStop(0, `rgba(245,158,11,${alpha})`);
      grad.addColorStop(0.5, `rgba(99,102,241,${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      grad.addColorStop(0, `rgba(99,102,241,${alpha})`);
      grad.addColorStop(0.5, `rgba(6,182,212,${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.beginPath();
    ctx.arc(pt.cx, pt.cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  // Draw centre dots on top
  mapped.forEach((pt, i) => {
    const intensity = densityMap[i] / maxDensity;
    ctx.beginPath();
    ctx.arc(pt.cx, pt.cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle =
      intensity > 0.6
        ? '#ec4899'
        : intensity > 0.3
        ? '#f59e0b'
        : '#818cf8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
}

export default function HeatmapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [error, setError] = useState('');

  // Load available pages
  useEffect(() => {
    fetch(`${API}/pages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPages(d.pages);
          if (d.pages.length > 0) setSelectedPage(d.pages[0]);
        }
      })
      .catch(() => setError('Cannot reach the backend. Is it running on port 4000?'))
      .finally(() => setPagesLoading(false));
  }, []);

  // Fetch clicks when page selection changes
  useEffect(() => {
    if (!selectedPage) return;
    setLoading(true);
    setError('');
    fetch(`${API}/heatmap?pageUrl=${encodeURIComponent(selectedPage)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClicks(d.clicks);
        else setError(d.error || 'Failed to load heatmap');
      })
      .catch(() => setError('Failed to fetch heatmap data.'))
      .finally(() => setLoading(false));
  }, [selectedPage]);

  // Render heatmap when clicks change
  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Find most common viewport
    const vw = clicks.find((c) => c.viewportWidth)?.viewportWidth || 1280;
    const vh = clicks.find((c) => c.viewportHeight)?.viewportHeight || 800;
    drawHeatmap(canvas, clicks, { w: vw, h: vh });
  }, [clicks]);

  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  // Responsive canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const wrapper = canvas.parentElement!;
      canvas.width = wrapper.clientWidth;
      canvas.height = Math.round(wrapper.clientWidth * 0.56);
      renderHeatmap();
    });
    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, [renderHeatmap]);

  const uniqueSessions = new Set(clicks.map((c) => c.sessionId)).size;

  return (
    <main className="page-wrapper">
      <div className="page-header fade-up">
        <h1>Click Heatmap</h1>
        <p>Visual representation of where users click on each page.</p>
      </div>

      {/* Stats row */}
      {!pagesLoading && (
        <div className="stats-row fade-up stagger-1">
          <div className="stat-card">
            <div className="stat-label">Tracked Pages</div>
            <div className="stat-value accent">{pages.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Clicks</div>
            <div className="stat-value pink">{clicks.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Sessions</div>
            <div className="stat-value green">{uniqueSessions}</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="heatmap-controls fade-up stagger-2">
        {pagesLoading ? (
          <div className="td-muted">Loading pages…</div>
        ) : (
          <select
            className="heatmap-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            disabled={pages.length === 0}
          >
            {pages.length === 0 ? (
              <option value="">No pages tracked yet</option>
            ) : (
              pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))
            )}
          </select>
        )}
        <button
          className="btn btn-ghost"
          onClick={() => {
            setLoading(true);
            fetch(`${API}/heatmap?pageUrl=${encodeURIComponent(selectedPage)}`)
              .then((r) => r.json())
              .then((d) => d.success && setClicks(d.clicks))
              .finally(() => setLoading(false));
          }}
          disabled={!selectedPage || loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

      {/* Canvas */}
      <div className="heatmap-canvas-wrapper fade-up stagger-3">
        {loading ? (
          <div className="loading-wrap" style={{ minHeight: '400px' }}>
            <div className="spinner" />
            <span>Loading heatmap…</span>
          </div>
        ) : clicks.length === 0 && selectedPage ? (
          <div className="heatmap-empty">
            <div className="heatmap-empty-icon">🖱️</div>
            <div className="empty-title">No clicks yet for this page</div>
            <div className="empty-desc">Visit the demo page and click around to populate the heatmap.</div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={1200}
            height={672}
            style={{ cursor: 'crosshair' }}
          />
        )}
      </div>

      {/* Legend */}
      {clicks.length > 0 && (
        <div className="heatmap-legend fade-up stagger-4">
          <span style={{ fontSize: '.8rem', color: 'var(--muted2)', fontWeight: 600 }}>Density:</span>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#818cf8' }} />
            Low
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }} />
            Medium
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ec4899' }} />
            High
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '.8rem', color: 'var(--muted2)' }}>
            {clicks.length} click{clicks.length !== 1 ? 's' : ''} across {uniqueSessions} session{uniqueSessions !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </main>
  );
}
