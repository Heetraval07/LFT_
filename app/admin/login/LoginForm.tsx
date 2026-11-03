'use client';
import { useSubmit } from '../_ui/useSubmit';
import { useActionState } from 'react';
import { loginAction, type FormState } from '../actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, undefined);
  const onSubmit = useSubmit(action);
  return (
    <form onSubmit={onSubmit} noValidate>
      {state?.error ? <div className="a-alert is-err" role="alert">{state.error}</div> : null}
      <input type="hidden" name="next" value={next} />
      <div className="a-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus={!state?.email} defaultValue={state?.email ?? ''} key={state?.email ?? 'empty'} />
      </div>
      <div className="a-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus={Boolean(state?.email)} />
      </div>
      <button className="a-btn is-accent" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
