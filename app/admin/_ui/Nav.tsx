'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const I = {
  dash: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2.5" y="2.5" width="6" height="7" rx="1"/><rect x="11.5" y="2.5" width="6" height="4" rx="1"/><rect x="11.5" y="9.5" width="6" height="8" rx="1"/><rect x="2.5" y="12.5" width="6" height="5" rx="1"/></svg>,
  proj: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2.5" y="3.5" width="15" height="13" rx="1.5"/><path d="M2.5 13l4-4 3 3 3-4 5 5"/><circle cx="7" cy="7.5" r="1.3"/></svg>,
  cat: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4h6l8 8-5 5-8-8V4z"/><circle cx="6.5" cy="7.5" r="1.2"/></svg>,
  test: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3.5 4.5h13v9h-7l-4 3v-3h-2z"/></svg>,
};

const items = [
  { href: '/admin', label: 'Dashboard', icon: I.dash, exact: true },
  { href: '/admin/projects', label: 'Projects', icon: I.proj, exact: false, not: '/admin/projects/categories' },
  { href: '/admin/projects/categories', label: 'Categories', icon: I.cat, exact: true },
  { href: '/admin/testimonials', label: 'Testimonials', icon: I.test, exact: false },
];

export default function Nav() {
  const path = usePathname();
  return (
    <>
      {items.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href) && !(it.not && path.startsWith(it.not));
        return (
          <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined}>
            {it.icon}
            {it.label}
          </Link>
        );
      })}
    </>
  );
}
