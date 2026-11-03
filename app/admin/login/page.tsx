import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentAdmin } from '../../../lib/auth.ts';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentAdmin()) redirect('/admin');
  const { next } = await searchParams;
  return (
    <main className="a-login">
      <div className="a-login-card">
        <img src="/images/logo/lft-logo.png" alt="LFT Interior Design" />
        <h1>LFT Admin</h1>
        <p className="a-sub">Sign in to manage projects and testimonials.</p>
        <LoginForm next={typeof next === 'string' ? next : ''} />
      </div>
    </main>
  );
}
