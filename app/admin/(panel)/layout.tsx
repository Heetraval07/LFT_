import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdmin } from '../../../lib/auth.ts';
import { logoutAction } from '../actions';
import Nav from '../_ui/Nav';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin(); // every page in the panel is checked on the server
  return (
    <div className="a-shell">
      <aside className="a-side">
        <Link href="/admin" className="a-brand">
          <img src="/images/logo/lft-logo-light.png" alt="" />
          <span>LFT Admin<small>Website content</small></span>
        </Link>
        <nav className="a-nav" aria-label="Admin">
          <Nav />
          <form action={logoutAction}>
            <button type="submit">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 4H4v12h4M12 6l4 4-4 4M16 10H8"/></svg>
              Logout
            </button>
          </form>
        </nav>
        <div className="a-side-foot">
          <span>Signed in as<br /><b style={{ color: '#ddd' }}>{admin.name}</b></span>
          <a href="/" target="_blank" rel="noopener">View website ↗</a>
        </div>
      </aside>
      <main className="a-main">{children}</main>
    </div>
  );
}
