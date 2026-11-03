import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectForm from '../../../_ui/ProjectForm';
import { categoriesForForm, projectForForm } from '../load';
import { uploadsEnabled } from '../../../../../lib/storage.ts';

export const metadata: Metadata = { title: 'Edit project' };

export default async function EditProject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [project, categories] = await Promise.all([projectForForm(id), categoriesForForm()]);
  if (!project) notFound();
  const { saved } = await searchParams;
  return (
    <>
      <div className="a-crumb"><Link href="/admin/projects">Projects</Link> / {project.name}</div>
      <div className="a-head"><h1>Edit Project</h1></div>
      <ProjectForm key={`${project.id}-${saved ?? ''}`} initial={project} categories={categories} uploadsReady={uploadsEnabled()} saved={saved && ['published', 'saved as a draft'].includes(saved) ? saved : undefined} />
    </>
  );
}
