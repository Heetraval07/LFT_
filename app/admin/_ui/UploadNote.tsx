// One short status line shown beside every uploader. Plain language; no technical page needed.
export type UploadStatus = { allowed: boolean; state: 'off' | 'provisional' | 'confirmed' | 'lost'; headline: string; detail: string };

export default function UploadNote({ status }: { status: UploadStatus }) {
  if (status.state === 'confirmed') return <p className="a-note" style={{ color: 'var(--a-ok)' }}>✓ {status.headline}</p>;
  const warn = status.state === 'provisional' && status.allowed;
  return (
    <div className={`a-alert ${warn ? 'is-info' : 'is-err'}`} style={{ marginTop: 14, marginBottom: 0 }} role="status">
      <b>{status.headline}</b> {status.detail}
    </div>
  );
}
