import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../../../lib/db.ts';

export const metadata: Metadata = { title: 'Dashboard' };

const fmt = (d: Date) => d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function Dashboard() {
  const [projects, published, testimonials, tPublished, recentP, recentT] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { isPublished: true } }),
    db.testimonial.count(),
    db.testimonial.count({ where: { isPublished: true } }),
    db.project.findMany({ orderBy: { updatedAt: 'desc' }, take: 6, select: { id: true, name: true, isPublished: true, updatedAt: true } }),
    db.testimonial.findMany({ orderBy: { updatedAt: 'desc' }, take: 6, select: { id: true, clientName: true, isPublished: true, updatedAt: true } }),
  ]);
  const stats = [
    { n: projects, label: 'Total projects', href: '/admin/projects' },
    { n: published, label: 'Published projects', href: '/admin/projects?status=published' },
    { n: projects - published, label: 'Draft projects', href: '/admin/projects?status=draft' },
    { n: testimonials, label: 'Total testimonials', href: '/admin/testimonials' },
    { n: tPublished, label: 'Published testimonials', href: '/admin/testimonials?status=published' },
  ];
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Dashboard</h1>
          <p>Changes you publish here appear on the website straight away.</p>
        </div>
        <div className="a-row">
          <Link className="a-btn is-accent" href="/admin/projects/new">+ Add New Project</Link>
          <Link className="a-btn" href="/admin/testimonials/new">+ Add New Testimonial</Link>
        </div>
      </div>
      <div className="a-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="a-stat"><b>{s.n}</b><span>{s.label}</span></Link>
        ))}
      </div>
      <div className="a-grid2">
        <section className="a-card">
          <h2>Recently updated projects</h2>
          {recentP.length ? (
            <ul className="a-recent">
              {recentP.map((p) => (
                <li key={p.id}>
                  <span><Link href={`/admin/projects/${p.id}`}>{p.name}</Link><br /><small>{fmt(p.updatedAt)}</small></span>
                  <span className={`a-badge ${p.isPublished ? 'is-on' : 'is-draft'}`}>{p.isPublished ? 'Published' : 'Draft'}</span>
                </li>
              ))}
            </ul>
          ) : <p className="a-empty">No projects yet.</p>}
        </section>
        <section className="a-card">
          <h2>Recently updated testimonials</h2>
          {recentT.length ? (
            <ul className="a-recent">
              {recentT.map((t) => (
                <li key={t.id}>
                  <span><Link href={`/admin/testimonials/${t.id}`}>{t.clientName}</Link><br /><small>{fmt(t.updatedAt)}</small></span>
                  <span className={`a-badge ${t.isPublished ? 'is-on' : 'is-draft'}`}>{t.isPublished ? 'Published' : 'Draft'}</span>
                </li>
              ))}
            </ul>
          ) : <p className="a-empty">No testimonials yet.</p>}
        </section>
      </div>
    </>
  );
}
