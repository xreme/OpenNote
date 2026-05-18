import { useState, useEffect, useCallback } from 'react';
import { getCollections } from '../services/collectionsService';
import { getVideos } from '../services/videoService';
import { getNotes, generateNotesForVideos } from '../services/notesService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronLeft, ChevronRight, Sparkles, Loader2,
  FileVideo, FileText, Library, Plus, AlertCircle, Eye,
} from 'lucide-react';
import MobileNav from './MobileNav';
import SourceInfoSheet from './SourceInfoSheet';
import AddSourceSheet from './AddSourceSheet';

const STORAGE_KEY = 'opennote-active-collection';
const POLL_MS = 5000;

const toCleanName = (name) =>
  name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9.]/gi, '_');

const STATUS = {
  completed:   { label: 'Ready',        color: 'var(--success)',  bg: 'rgba(58,158,82,0.12)',    spinning: false },
  error:       { label: 'Error',        color: '#d94f4f',         bg: 'rgba(217,79,79,0.12)',    spinning: false },
  uploading:   { label: 'Uploading',    color: 'var(--accent)',   bg: 'rgba(230,195,91,0.15)',   spinning: true  },
  compressing: { label: 'Compressing',  color: 'var(--accent)',   bg: 'rgba(230,195,91,0.15)',   spinning: true  },
  transcribing:{ label: 'Transcribing', color: 'var(--accent)',   bg: 'rgba(230,195,91,0.15)',   spinning: true  },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.uploading;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '20px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.spinning && <Loader2 size={9} className="spin" />}
      {cfg.label}
    </span>
  );
}

function DetailView({ item, collectionId, onBack, onRefresh }) {
  const isNote = item._type === 'note';
  const title = isNote
    ? item.filename.replace(/_/g, ' ').replace(/\.[^.]+$/, '')
    : item.originalName.replace(/\.[^.]+$/, '');

  const [content, setContent] = useState(isNote ? item.content : item._summary?.content ?? null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const canGenerate = !isNote && item.status === 'completed' && !content;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      await generateNotesForVideos([item.id], collectionId);
      const res = await getNotes(collectionId);
      const cleanName = toCleanName(item.originalName);
      const match = res.data.find(n => n.filename.startsWith(cleanName));
      if (match) setContent(match.content);
      if (onRefresh) onRefresh();
    } catch (err) {
      setGenError(err.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-color)', color: 'var(--text-main)',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    }}>
      <header style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        background: 'var(--sidebar-bg)',
        borderBottom: '2px solid var(--card-border)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', padding: '2px 0',
            cursor: 'pointer', color: 'var(--text-main)',
            display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '1px',
          }}
        >
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px', fontWeight: 'bold',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </div>
          {!isNote && (
            <div style={{ marginTop: '4px' }}>
              <StatusBadge status={item.status} />
            </div>
          )}
        </div>
        {!isNote && (
          <button
            onClick={() => setShowInfo(true)}
            style={{
              background: 'none', border: 'none', padding: '4px',
              cursor: 'pointer', color: 'var(--text-dim)',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <Eye size={20} />
          </button>
        )}
      </header>

      {showInfo && <SourceInfoSheet video={item} onClose={() => setShowInfo(false)} />}

      <main style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        padding: '20px 16px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      }}>
        {generating ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-dim)',
            marginTop: '80px', fontSize: '13px', lineHeight: '1.7',
          }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--primary)', display: 'block', margin: '0 auto 14px' }} />
            Generating summary…
          </div>
        ) : content ? (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', color: 'var(--text-dim)',
            marginTop: '80px', fontSize: '13px', lineHeight: '1.7',
            padding: '0 24px',
          }}>
            <Sparkles size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
            {!isNote && item.status !== 'completed'
              ? 'Summary will be available after this source finishes processing.'
              : 'No summary yet.'}

            {canGenerate && (
              <button
                onClick={handleGenerate}
                style={{
                  marginTop: '20px',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px',
                  background: 'var(--primary)', color: 'var(--bg-color)',
                  border: '2px solid var(--card-border)', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', letterSpacing: '0.03em',
                }}
              >
                <Sparkles size={14} /> Generate Summary
              </button>
            )}

            {genError && (
              <div style={{
                marginTop: '16px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
                color: '#d94f4f', fontSize: '12px',
              }}>
                <AlertCircle size={13} /> {genError}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MobileLibraryPage() {
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [infoVideo, setInfoVideo] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    getCollections().then(res => {
      const cols = res.data;
      setCollections(cols);
      if (!localStorage.getItem(STORAGE_KEY) && cols.length > 0) {
        setCollectionId(cols[0].id);
      }
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!collectionId) return;
    try {
      const [vRes, nRes] = await Promise.all([
        getVideos(collectionId),
        getNotes(collectionId),
      ]);
      setVideos(vRes.data);
      setNotes(nRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    setLoading(true);
    setVideos([]);
    setNotes([]);
    fetchData();
  }, [fetchData]);

  // Poll while any source is still processing
  useEffect(() => {
    const hasProcessing = videos.some(v => !['completed', 'error'].includes(v.status));
    if (!hasProcessing) return;
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [videos, fetchData]);

  const handleCollectionChange = (id) => {
    setCollectionId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setSelected(null);
  };

  // Attach matched summary to each video
  const videosWithSummary = videos.map(v => {
    const cleanName = toCleanName(v.originalName);
    const summary = notes.find(n => n.filename.startsWith(cleanName));
    return { ...v, _summary: summary };
  });

  // Notes not belonging to any video
  const videoCleanNames = videos.map(v => toCleanName(v.originalName));
  const standaloneNotes = notes.filter(n =>
    !videoCleanNames.some(name => n.filename.startsWith(name))
  );

  const activeCollection = collections.find(c => c.id === collectionId);

  if (selected) {
    return (
      <DetailView
        item={selected}
        collectionId={collectionId}
        onBack={() => setSelected(null)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-color)', color: 'var(--text-main)',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    }}>

      {/* Header */}
      <header style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        background: 'var(--sidebar-bg)',
        borderBottom: '2px solid var(--card-border)',
      }}>
        <Library size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.03em', flexShrink: 0 }}>
          OpenNote
        </span>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <select
            value={collectionId}
            onChange={e => handleCollectionChange(e.target.value)}
            style={{
              width: '100%', padding: '4px 28px 4px 10px',
              border: '2px solid var(--card-border)', borderRadius: '8px',
              background: 'var(--card-bg)', color: 'var(--text-main)',
              fontFamily: 'inherit', fontSize: '16px',
              cursor: 'pointer', outline: 'none', appearance: 'none',
            }}
          >
            {collections.length === 0 && <option value="">Loading...</option>}
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <ChevronRight
            size={13}
            style={{
              position: 'absolute', right: '9px', top: '50%',
              transform: 'translateY(-50%) rotate(90deg)',
              pointerEvents: 'none', color: 'var(--text-dim)',
            }}
          />
        </div>
      </header>

      <MobileNav active="Library" />

      {/* List */}
      <main style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)' }}>
          <button
            onClick={() => setShowAddSheet(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              width: '100%', padding: '10px',
              background: 'var(--primary)', borderRadius: '8px',
              border: '2px solid var(--card-border)',
              color: 'var(--bg-color)',
              fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
              letterSpacing: '0.03em', cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Add Source
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px', color: 'var(--text-dim)' }}>
            <Loader2 size={24} className="spin" />
          </div>
        ) : videosWithSummary.length === 0 && standaloneNotes.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-dim)',
            marginTop: '80px', fontSize: '13px', lineHeight: '1.7', padding: '0 32px',
          }}>
            <Library size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
            {activeCollection
              ? `No sources in "${activeCollection.title}" yet.`
              : 'Select a collection to view its sources.'}
          </div>
        ) : (
          <>
            {/* Sources */}
            {videosWithSummary.length > 0 && (
              <section>
                <div style={{
                  padding: '16px 16px 8px',
                  fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-dim)',
                }}>
                  Sources — {videosWithSummary.length}
                </div>
                {videosWithSummary.map(video => (
                  <div
                    key={video.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      borderBottom: '1px solid var(--card-border)',
                    }}
                  >
                    <div
                      onClick={() => setSelected({ ...video, _type: 'video' })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        flex: 1, minWidth: 0, padding: '14px 0 14px 16px', cursor: 'pointer',
                      }}
                    >
                      <FileVideo size={18} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {video.originalName.replace(/\.[^.]+$/, '')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <StatusBadge status={video.status} />
                          {video._summary && (
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Sparkles size={10} /> Summary
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    </div>
                    <button
                      onClick={() => setInfoVideo(video)}
                      style={{
                        background: 'none', border: 'none',
                        padding: '14px 16px',
                        cursor: 'pointer', color: 'var(--text-dim)',
                        display: 'flex', alignItems: 'center', flexShrink: 0,
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                ))}
              </section>
            )}

            {/* Standalone notes */}
            {standaloneNotes.length > 0 && (
              <section>
                <div style={{
                  padding: '16px 16px 8px',
                  fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-dim)',
                }}>
                  Notes — {standaloneNotes.length}
                </div>
                {standaloneNotes.map(note => (
                  <button
                    key={note.filename}
                    onClick={() => setSelected({ ...note, _type: 'note' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      width: '100%', padding: '14px 16px',
                      background: 'none', border: 'none',
                      borderBottom: '1px solid var(--card-border)',
                      cursor: 'pointer', textAlign: 'left',
                      color: 'var(--text-main)', fontFamily: 'inherit',
                    }}
                  >
                    <FileText size={18} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {note.filename.replace(/_/g, ' ').replace(/\.[^.]+$/, '')}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  </button>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {infoVideo && <SourceInfoSheet video={infoVideo} onClose={() => setInfoVideo(null)} />}
      {showAddSheet && (
        <AddSourceSheet
          collectionId={collectionId}
          onClose={() => setShowAddSheet(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
