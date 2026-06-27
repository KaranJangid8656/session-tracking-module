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

 
      )}
    </main>
  );
}
