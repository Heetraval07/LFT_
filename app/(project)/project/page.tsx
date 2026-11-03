import type { Metadata, Viewport } from 'next';
import LegacyBoot from '../../_components/LegacyBoot';
import { getSiteData } from '../../../lib/public-data.ts';
import { db } from '../../../lib/db.ts';

// Generated from project.html. The markup below is the original page markup, unchanged.
export const dynamic = 'force-dynamic'; // always read the latest published content
// The tab title comes from the project in the database, so it is correct before any script runs.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }): Promise<Metadata> {
  const slug = String((await searchParams).p || '');
  const project = slug ? await db.project.findFirst({ where: { slug, isPublished: true }, select: { name: true, shortDescription: true } }) : null;
  return {
    title: project ? `${project.name} — LFT Interior Design` : 'Project not found — LFT Interior Design',
    description: project?.shortDescription,
    icons: { icon: { url: '/images/logo/lft-logo.png', type: 'image/png' } },
  };
}
export const viewport: Viewport = { themeColor: "#1b1b1b", colorScheme: 'dark' };

const MAIN = "";

export default async function Page() {
  const data = await getSiteData({ projects: true });
  return (
    <>
      <main id="project" dangerouslySetInnerHTML={{ __html: MAIN }} />
      <LegacyBoot data={data} />
    </>
  );
}
