import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../../../../../lib/db.ts';
import { deleteCategory } from '../../../actions';
import CategoryRow from '../../../_ui/CategoryRow';
import ConfirmButton from '../../../_ui/Confirm';

export const metadata: Metadata = { title: 'Categories' };

export default async function Categories() {
  const cats = await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { projects: true } } } });
  return (
    <>
      <div className="a-crumb"><Link href="/admin/projects">Projects</Link> / Categories</div>
      <div className="a-head">
        <div>
          <h1>Project Categories</h1>
          <p>These are the filter tabs on the website&apos;s Projects page, in this order (after &ldquo;All&rdquo;).</p>
        </div>
      </div>
      <section className="a-card">
        <h2>Add a category</h2>
        <CategoryRow cta="Add category" />
      </section>
      <section className="a-card">
        <h2>Categories <small>{cats.length}</small></h2>
        {cats.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {cats.map((c) => (
              <div key={c.id} className="a-row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--a-line)', paddingBottom: 12 }}>
                <div style={{ flex: '1 1 420px' }}><CategoryRow id={c.id} name={c.name} sortOrder={c.sortOrder} cta="Save" /></div>
                <span className="a-sub" style={{ color: 'var(--a-muted)', fontSize: 13 }}>{c._count.projects} project{c._count.projects === 1 ? '' : 's'}</span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton className="a-btn is-sm is-danger" message={c._count.projects ? `"${c.name}" is used by ${c._count.projects} project(s). Delete it anyway? The projects stay, they just won't be listed under this tab.` : `Delete "${c.name}"?`}>Delete</ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        ) : <p className="a-empty">No categories yet.</p>}
      </section>
    </>
  );
}
