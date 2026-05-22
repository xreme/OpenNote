import { useState } from 'react';
import { X, Link2, Upload, RotateCcw, Trash2, Loader2 } from 'lucide-react';

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-dim)',
      }}>
        {label}
      </span>
      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{children}</div>
    </div>
  );
}

export default function SourceInfoSheet({ video, onClose, onRetry, onDelete, previewMode }) {
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const timestamp = parseInt(video.id, 10);
  const addedDate = isNaN(timestamp)
    ? '—'
    : new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const isLink = !!video.sourceUrl;
  const isFailed = video.status === 'error';
  const displayName = video.originalName.replace(/\.[^.]+$/, '');

  const handleRetry = async () => {
    setRetrying(true);
    setActionError(null);
    try {
      await onRetry(video.id);
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await onDelete(video.id);
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Delete failed. Please try again.');
      setDeleting(false);
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
          background: 'var(--card-bg)',
          borderRadius: '16px 16px 0 0',
          border: '2px solid var(--card-border)',
          borderBottom: 'none',
          padding: '8px 20px 0',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
          color: 'var(--text-main)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: '36px', height: '4px',
          background: 'var(--card-border)', borderRadius: '2px',
          margin: '0 auto 16px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            flex: 1, minWidth: 0,
            fontSize: '15px', fontWeight: 'bold',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', padding: '2px',
              cursor: 'pointer', color: 'var(--text-dim)',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InfoRow label="Date added">{addedDate}</InfoRow>

          <InfoRow label="Source type">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {isLink
                ? <><Link2 size={13} style={{ color: 'var(--primary)' }} /> Added via link</>
                : <><Upload size={13} style={{ color: 'var(--primary)' }} /> File upload</>}
            </span>
          </InfoRow>

          {isLink && (
            <InfoRow label="Original link">
              <a
                href={video.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--primary)',
                  wordBreak: 'break-all',
                  lineHeight: '1.5',
                  textDecoration: 'underline',
                }}
              >
                {video.sourceUrl}
              </a>
            </InfoRow>
          )}
        </div>

        {/* Action buttons */}
        {(onRetry || onDelete) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            {actionError && (
              <div style={{ fontSize: '12px', color: '#d94f4f', textAlign: 'center' }}>
                {actionError}
              </div>
            )}
            {isFailed && isLink && onRetry && (
              <button
                onClick={() => !previewMode && handleRetry()}
                disabled={previewMode || retrying || deleting}
                title={previewMode ? "Not available in preview mode" : undefined}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px',
                  background: 'var(--primary)', color: 'var(--bg-color)',
                  border: '2px solid var(--card-border)', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
                  letterSpacing: '0.03em',
                  cursor: previewMode || retrying || deleting ? 'not-allowed' : 'pointer',
                  opacity: previewMode ? 0.4 : (retrying || deleting ? 0.6 : 1),
                }}
              >
                {retrying ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                {retrying ? 'Retrying…' : 'Retry Processing'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => !previewMode && handleDelete()}
                disabled={previewMode || retrying || deleting}
                title={previewMode ? "Not available in preview mode" : undefined}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px',
                  background: 'transparent', color: '#d94f4f',
                  border: '2px solid rgba(217,79,79,0.35)', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
                  letterSpacing: '0.03em',
                  cursor: previewMode || retrying || deleting ? 'not-allowed' : 'pointer',
                  opacity: previewMode ? 0.4 : (retrying || deleting ? 0.6 : 1),
                }}
              >
                {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                {deleting ? 'Deleting…' : 'Delete Source'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
