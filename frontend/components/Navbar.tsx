'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const path = usePathname();

  return (
    <nav className="navbar">
      <span className="navbar-logo">⚡ CausalFunnel</span>
      <span className="navbar-subtitle">Analytics Dashboard</span>
      <Link
        href="/"
        className={`nav-link ${path === '/' || path.startsWith('/sessions') ? 'active' : ''}`}
      >
        Sessions
      </Link>
      <Link
        href="/heatmap"
        className={`nav-link ${path === '/heatmap' ? 'active' : ''}`}
      >
        Heatmap
      </Link>
    </nav>
  );
}
