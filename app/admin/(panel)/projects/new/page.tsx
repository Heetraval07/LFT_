import type { Metadata } from 'next';
import Link from 'next/link';
import ProjectForm from '../../../_ui/ProjectForm';
import { categoriesForForm, nextSortOrder } from '../load';
import { uploadsEnabled } from '../../../../../lib/storage.ts';

export const metadata: Metadata = { title: 'New project' };

export default async function NewProject() {
  const [categories, sortOrder] = await Promise.all([categoriesForForm(), nextSortOrder()]);
  return (
    <>
      <div className="a-crumb"><Link href="/admin/projects">Projects</Link> / New</div>
      <div className="a-head"><h1>Add New Project</h1></div>
      <ProjectForm
        categories={categories}
        uploadsReady={uploadsEnabled()}
        initial={{
          name: '', slug: '', client: '', shortDescription: '', description: '', location: '', type: '', designVision: '', keyDetails: '',
          mainCategoryId: '', extraCategoryIds: [], isFeatured: false, homeOrder: 0, sortOrder, isPublished: false, images: [],
        }}
      />
    </>
  );
}
