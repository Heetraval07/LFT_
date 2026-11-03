'use client';
import { useSubmit } from './useSubmit';
import { useActionState, useEffect, useRef } from 'react';
import { saveCategory, type FormState } from '../actions';

export default function CategoryRow({ id, name, sortOrder, cta }: { id?: number; name?: string; sortOrder?: number; cta: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, undefined);
  const onSubmit = useSubmit(action);
  const formRef = useRef<HTMLFormElement>(null);
  // the "add" form empties itself after a successful add; edit rows keep their values
  useEffect(() => { if (state?.ok && !id) formRef.current?.reset(); }, [state, id]);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="a-row" style={{ alignItems: 'flex-end' }}>
      <input type="hidden" name="id" value={id ?? ''} />
      <div className="a-field" style={{ margin: 0, flex: '1 1 220px' }}>
        <label htmlFor={`cat-name-${id ?? 'new'}`} className={id ? 'sr-only' : undefined}>Name</label>
        <input id={`cat-name-${id ?? 'new'}`} name="name" type="text" required maxLength={80} defaultValue={name} placeholder="e.g. Hospitality" />
      </div>
      <div className="a-field" style={{ margin: 0, width: 90 }}>
        <label htmlFor={`cat-order-${id ?? 'new'}`} className={id ? 'sr-only' : undefined}>Order</label>
        <input id={`cat-order-${id ?? 'new'}`} name="sortOrder" type="number" min={0} max={1000} defaultValue={sortOrder ?? 0} />
      </div>
      <button className={`a-btn is-sm ${id ? 'is-ghost' : 'is-accent'}`} disabled={pending}>{pending ? 'Saving…' : cta}</button>
      {state?.error ? <span style={{ color: 'var(--a-err)', fontSize: 13 }} role="alert">{state.error}</span> : null}
      {state?.ok ? <span style={{ color: 'var(--a-ok)', fontSize: 13 }} role="status">{state.ok}</span> : null}
    </form>
  );
}
