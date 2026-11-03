'use client';
// Submits a form to a server action WITHOUT React's automatic form reset, so typed values are kept
// when the server returns a validation error. The clicked button's name/value (e.g. intent=publish) is included.
import { startTransition, type FormEvent } from 'react';

export function useSubmit(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
}
