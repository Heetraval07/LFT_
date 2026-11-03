import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../../../../lib/db.ts';
import { deleteProject, moveProject, setProjectFlag } from '../../actions';
import ConfirmButton from '../../_ui/Confirm';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; deleted?: string; error?: string }> }) {
  const sp = await searchParams;
  const where = sp.status === 'published' ? { isPublished: true } : sp.status === 'draft' ? { isPublished: false } : {};
  const rows = await db.project.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      images: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }], take: 1 },
      categories: { orderBy: { position: 'asc' }, include: { category: true } },
      _count: { select: { images: true } },
    },
  });
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Projects</h1>
          <p>The order here is the order on the website&apos;s Projects page.</p>
        </div>
        <div className="a-row">
          <Link className="a-btn is-ghost" href="/admin/projects/categories">Manage categories</Link>
          <Link className="a-btn is-accent" href="/admin/projects/new">+ Add New Project</Link>
        </div>
      </div>
      {sp.deleted ? <div className="a-alert is-ok">Project deleted.</div> : null}
      {sp.error ? <div className="a-alert is-err">{sp.error}</div> : null}
      <div className="a-row" style={{ marginBottom: 14 }}>
        {[['', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([v, l]) => (
          <Link key={v} href={v ? `/admin/projects?status=${v}` : '/admin/projects'} className={`a-btn is-sm ${(sp.status || '') === v ? '' : 'is-ghost'}`}>{l}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="a-card a-empty">No projects here yet. <Link href="/admin/projects/new">Add the first one</Link>.</div>
      ) : (
        <table className="a-table">
          <thead>
            <tr><th style={{ width: 64 }}>Order</th><th style={{ width: 90 }}>Photo</th><th>Project</th><th>Category</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id}>
                <td>
                  <div className="a-row" style={{ gap: 4 }}>
                    <form action={moveProject}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="up" /><button className="a-icon-btn" disabled={i === 0 || Boolean(sp.status)} aria-label={`Move ${p.name} up`}>↑</button></form>
                    <form action={moveProject}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="down" /><button className="a-icon-btn" disabled={i === rows.length - 1 || Boolean(sp.status)} aria-label={`Move ${p.name} down`}>↓</button></form>
                  </div>
                </td>
                <td>{p.images[0] ? <img className="a-thumb" src={p.images[0].path} alt="" /> : <div className="a-thumb" />}</td>
                <td>
                  <Link className="a-title" href={`/admin/projects/${p.id}`}>{p.name}</Link>
                  <div className="a-sub">{p.location} · {p._count.images} photo{p._count.images === 1 ? '' : 's'}</div>
                </td>
                <td className="a-sub">{p.categories.map((c) => c.category.name).join(', ') || '—'}</td>
                <td>
                  <div className="a-row" style={{ gap: 6 }}>
                    <span className={`a-badge ${p.isPublished ? 'is-on' : 'is-draft'}`}>{p.isPublished ? 'Published' : 'Draft'}</span>
                    {p.isFeatured ? <span className="a-badge is-star">★ Homepage</span> : null}
                  </div>
                </td>
                <td>
                  <div className="a-actions">
                    <Link className="a-btn is-sm is-ghost" href={`/admin/projects/${p.id}`}>Edit</Link>
                    {p.isPublished ? <a className="a-btn is-sm is-ghost" href={`/project.html?p=${p.slug}`} target="_blank" rel="noopener">View ↗</a> : null}
                    <form action={setProjectFlag}>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="flag" value="isPublished" /><input type="hidden" name="value" value={String(!p.isPublished)} />
                      <button className="a-btn is-sm is-ghost">{p.isPublished ? 'Unpublish' : 'Publish'}</button>
                    </form>
                    <form action={setProjectFlag}>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="flag" value="isFeatured" /><input type="hidden" name="value" value={String(!p.isFeatured)} />
                      <button className="a-btn is-sm is-ghost">{p.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}</button>
                    </form>
                    <form action={deleteProject}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton className="a-btn is-sm is-danger" message={`Delete "${p.name}" and its ${p._count.images} photo record(s)? This cannot be undone.`}>Delete</ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
