import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getCollections } from '../services/collectionsService';
import { getVideos } from '../services/videoService';
import { getNotes } from '../services/notesService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  FileVideo, FileText, Sparkles, X, Loader2, AlertCircle, Eye,
} from 'lucide-react';
import { generateNotesForVideos } from '../services/notesService';
import MobileNav from './MobileNav';
import SourceInfoSheet from './SourceInfoSheet';

const STORAGE_KEY = 'opennote-active-collection';
const toCleanName = (name) => name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9.]/gi, '_');

function snippet(text, query, pad = 80) {
  if (!text || !query) return text?.slice(0, pad) ?? '';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, pad) + (text.length > pad ? '…' : '');
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 50);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{
        background: 'var(--accent)', color: 'var(--text-main)',
        borderRadius: '2px', padding: '0 1px',
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
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
        <button onClick={onBack} style={{
          background: 'none', border: 'none', padding: '2px 0',
          cursor: 'pointer', color: 'var(--text-main)',
          display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '1px',
        }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px', fontWeight: 'bold',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </div>
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
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
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

export default function MobileSearchPage() {
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [infoVideo, setInfoVideo] = useState(null);
  const inputRef = useRef(null);

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
    setLoading(true);
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
    setVideos([]);
    setNotes([]);
    setQuery('');
    fetchData();
  }, [fetchData]);

  const handleCollectionChange = (id) => {
    setCollectionId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setQuery('');
    setSelected(null);
  };

  // Attach summaries to videos
  const videosWithSummary = useMemo(() =>
    videos.map(v => {
      const cleanName = toCleanName(v.originalName);
      return { ...v, _type: 'video', _summary: notes.find(n => n.filename.startsWith(cleanName)) };
    }),
  [videos, notes]);

  const videoCleanNames = useMemo(() =>
    videos.map(v => toCleanName(v.originalName)),
  [videos]);

  const standaloneNotes = useMemo(() =>
    notes
      .filter(n => !videoCleanNames.some(name => n.filename.startsWith(name)))
      .map(n => ({ ...n, _type: 'note' })),
  [notes, videoCleanNames]);

  const q = query.trim().toLowerCase();

  const videoResults = useMemo(() => {
    if (!q) return [];
    return videosWithSummary.filter(v => {
      const nameMatch = v.originalName.toLowerCase().includes(q);
      const summaryMatch = v._summary?.content?.toLowerCase().includes(q);
      return nameMatch || summaryMatch;
    });
  }, [q, videosWithSummary]);

  const noteResults = useMemo(() => {
    if (!q) return [];
    return standaloneNotes.filter(n =>
      n.filename.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    );
  }, [q, standaloneNotes]);

  const hasResults = videoResults.length > 0 || noteResults.length > 0;

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
        <Search size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
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
          <ChevronDown size={13} style={{
            position: 'absolute', right: '9px', top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-dim)',
          }} />
        </div>
      </header>

      <MobileNav active="Search" />

      {/* Search bar */}
      <div style={{
        flexShrink: 0,
        padding: '12px 16px',
        background: 'var(--bg-color)',
        borderBottom: '1px solid var(--card-border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '2px solid var(--card-border)', borderRadius: '10px',
          background: 'var(--card-bg)', padding: '0 12px',
        }}>
          <Search size={15} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search sources and notes..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              color: 'var(--text-main)', fontFamily: 'inherit',
              fontSize: '16px', outline: 'none', padding: '11px 0',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                background: 'none', border: 'none', padding: '4px',
                cursor: 'pointer', color: 'var(--text-dim)',
                display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <main style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px', color: 'var(--text-dim)' }}>
            <Loader2 size={24} className="spin" />
          </div>
        ) : !query.trim() ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-dim)',
            marginTop: '80px', fontSize: '13px', lineHeight: '1.7', padding: '0 32px',
          }}>
            <Search size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
            Search across source names, summaries, and notes.
          </div>
        ) : !hasResults ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-dim)',
            marginTop: '80px', fontSize: '13px', padding: '0 32px',
          }}>
            No results for <strong style={{ color: 'var(--text-main)' }}>"{query}"</strong>
          </div>
        ) : (
          <>
            {videoResults.length > 0 && (
              <section>
                <div style={{
                  padding: '14px 16px 6px',
                  fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-dim)',
                }}>
                  Sources — {videoResults.length}
                </div>
                {videoResults.map(video => {
                  const nameMatch = video.originalName.toLowerCase().includes(q);
                  const summarySnippet = !nameMatch && video._summary?.content
                    ? snippet(video._summary.content, query)
                    : null;
                  return (
                    <div
                      key={video.id}
                      style={{
                        display: 'flex', alignItems: 'center',
                        borderBottom: '1px solid var(--card-border)',
                      }}
                    >
                      <div
                        onClick={() => setSelected(video)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          flex: 1, minWidth: 0, padding: '14px 0 14px 16px', cursor: 'pointer',
                        }}
                      >
                        <FileVideo size={18} style={{ color: 'var(--text-dim)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px', fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            <Highlight text={video.originalName.replace(/\.[^.]+$/, '')} query={query} />
                          </div>
                          {summarySnippet && (
                            <div style={{
                              fontSize: '12px', color: 'var(--text-dim)',
                              marginTop: '3px', lineHeight: '1.5',
                            }}>
                              <Highlight text={summarySnippet} query={query} />
                            </div>
                          )}
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
                  );
                })}
              </section>
            )}

            {noteResults.length > 0 && (
              <section>
                <div style={{
                  padding: '14px 16px 6px',
                  fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-dim)',
                }}>
                  Notes — {noteResults.length}
                </div>
                {noteResults.map(note => {
                  const displayName = note.filename.replace(/_/g, ' ').replace(/\.[^.]+$/, '');
                  const contentSnippet = snippet(note.content, query);
                  return (
                    <button
                      key={note.filename}
                      onClick={() => setSelected(note)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        width: '100%', padding: '14px 16px',
                        background: 'none', border: 'none',
                        borderBottom: '1px solid var(--card-border)',
                        cursor: 'pointer', textAlign: 'left',
                        color: 'var(--text-main)', fontFamily: 'inherit',
                      }}
                    >
                      <FileText size={18} style={{ color: 'var(--text-dim)', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <Highlight text={displayName} query={query} />
                        </div>
                        {contentSnippet && (
                          <div style={{
                            fontSize: '12px', color: 'var(--text-dim)',
                            marginTop: '3px', lineHeight: '1.5',
                          }}>
                            <Highlight text={contentSnippet} query={query} />
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      {infoVideo && <SourceInfoSheet video={infoVideo} onClose={() => setInfoVideo(null)} />}
    </div>
  );
}
