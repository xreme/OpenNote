import { useState, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddSourceSheet({ collectionId, onClose, onSuccess }) {
  const [url, setUrl] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef(null);

  const reset = () => {
    setStatus('idle');
    setErrorMsg('');
    setPendingFile(null);
    setUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submitUrl = async (e) => {
    e.preventDefault();
    if (!url.trim() || !collectionId || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/upload/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), collectionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('success');
      setUrl('');
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitFile = async () => {
    if (!pendingFile || !collectionId || loading) return;
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('videos', pendingFile);
    formData.append('collectionId', collectionId);
    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());
      setStatus('success');
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--bg-color)',
          borderRadius: '16px 16px 0 0',
          border: '2px solid var(--card-border)',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90dvh',
          color: 'var(--text-main)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          flexShrink: 0,
          padding: '12px 20px 0',
        }}>
          <div style={{
            width: '36px', height: '4px',
            background: 'var(--card-border)', borderRadius: '2px',
            margin: '0 auto 14px',
          }} />

          {/* Sheet header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ flex: 1, fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
              Add Source
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', padding: '4px',
                cursor: 'pointer', color: 'var(--text-dim)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0 20px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
        }}>
          {status === 'success' ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', padding: '24px 0 8px', gap: '12px',
            }}>
              <CheckCircle size={48} style={{ color: 'var(--success)' }} />
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Added to vault</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>
                Your content is being processed.
              </p>
              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
                <button onClick={reset} style={{ ...btn, flex: 1 }}>
                  Add Another
                </button>
                <button onClick={onClose} style={{ ...btn, flex: 1, background: 'var(--bg-color)', color: 'var(--text-main)', border: 'var(--border-width) solid var(--card-border)', boxShadow: 'none' }}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '4px' }}>

              {/* URL */}
              <form onSubmit={submitUrl} style={field}>
                <label style={label}>Paste a link</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  style={input}
                />
                <button
                  type="submit"
                  disabled={!url.trim() || loading}
                  style={{ ...btn, opacity: (!url.trim() || loading) ? 0.5 : 1 }}
                >
                  {loading && !pendingFile ? <Loader2 size={15} className="spin" /> : null}
                  {loading && !pendingFile ? 'Adding…' : 'Add Link'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
              </div>

              {/* File upload */}
              <div style={field}>
                <label style={label}>Upload a file</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setPendingFile(f); }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  style={{ ...btn, background: 'var(--card-bg)', color: 'var(--text-main)', border: 'var(--border-width) solid var(--card-border)', boxShadow: 'none' }}
                >
                  {pendingFile ? `📎 ${pendingFile.name}` : 'Choose a video'}
                </button>
                {pendingFile && (
                  <button
                    type="button"
                    onClick={submitFile}
                    disabled={loading}
                    style={{ ...btn, opacity: loading ? 0.5 : 1 }}
                  >
                    {loading && pendingFile ? <Loader2 size={15} className="spin" /> : null}
                    {loading && pendingFile ? 'Uploading…' : 'Upload File'}
                  </button>
                )}
              </div>

              {status === 'error' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#d94f4f', fontSize: '13px', lineHeight: 1.5 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const field = { display: 'flex', flexDirection: 'column', gap: '8px' };

const label = {
  fontSize: '11px', fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-dim)',
};

const input = {
  width: '100%', padding: '14px',
  fontSize: '16px',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  border: 'var(--border-width) solid var(--card-border)',
  borderRadius: 'var(--radius)',
  background: 'var(--card-bg)',
  color: 'var(--text-main)',
  outline: 'none', boxSizing: 'border-box',
};

const btn = {
  width: '100%', padding: '14px',
  fontSize: '14px',
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  fontWeight: 700,
  background: 'var(--primary)',
  color: '#1a1a18',
  border: 'var(--border-width) solid var(--border-color)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-sm)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  letterSpacing: '0.04em', boxSizing: 'border-box',
};
