import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getCollections } from '../services/collectionsService';
import { getVideos, deleteVideoById, retryVideo } from '../services/videoService';
import { getNotes, generateNotesForVideos } from '../services/notesService';
import { sendChatQuery } from '../services/chatService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, Loader2, FileVideo, FileText,
  Library, MessageSquare, Search as SearchIcon,
  Plus, AlertCircle, Eye, ArrowUp, X,
} from 'lucide-react';
import MobileNav from './MobileNav';
import SourceInfoSheet from './SourceInfoSheet';
import AddSourceSheet from './AddSourceSheet';
import VideoPlayer from '../features/videos/VideoPlayer';

const STORAGE_KEY = 'opennote-active-collection';
const POLL_MS = 5000;

const toCleanName = (name) =>
  name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9.]/gi, '_');

const STATUS = {
  completed:    { label: 'Ready',        color: 'var(--success)',  bg: 'rgba(58,158,82,0.12)',  spinning: false },
  error:        { label: 'Error',        color: '#d94f4f',         bg: 'rgba(217,79,79,0.12)',  spinning: false },
  uploading:    { label: 'Uploading',    color: 'var(--accent)',   bg: 'rgba(230,195,91,0.15)', spinning: true  },
  compressing:  { label: 'Compressing',  color: 'var(--accent)',   bg: 'rgba(230,195,91,0.15)', spinning: true  },
  transcribing: { label: 'Transcribing', color: 'var(--accent)',   bg: 'rgba(230,195,91,0.15)', spinning: true  },
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
      <mark style={{ background: 'var(--accent)', color: 'var(--text-main)', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [activeTab, setActiveTab] = useState('summary');
  const [previewOpen, setPreviewOpen] = useState(false);

  const hasPreview = !isNote && item.status === 'completed' && (item.outputPath || item.sourceUrl);
  const isPortrait = !!(item.sourceUrl && !item.outputPath && /tiktok\.com|instagram\.com/i.test(item.sourceUrl));

  const canGenerate = !isNote && item.status === 'completed' && !content;
  const transcript = !isNote ? (item.transcript ?? []) : [];

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
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg-color)', color: 'var(--text-main)',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      overflow: 'hidden',
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
          {!isNote && (
            <div style={{ marginTop: '4px' }}>
              <StatusBadge status={item.status} />
            </div>
          )}
        </div>
        {!isNote && (
          <button onClick={() => setShowInfo(true)} style={{
            background: 'none', border: 'none', padding: '4px',
            cursor: 'pointer', color: 'var(--text-dim)',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}>
            <Eye size={20} />
          </button>
        )}
      </header>

      {showInfo && (
        <SourceInfoSheet
          video={item}
          onClose={() => setShowInfo(false)}
          onRetry={async (id) => { await retryVideo(id); if (onRefresh) onRefresh(); setShowInfo(false); }}
          onDelete={async (id) => { await deleteVideoById(id); if (onRefresh) onRefresh(); onBack(); }}
        />
      )}

      {/* Tab bar — only for video items */}
      {!isNote && (
        <div style={{
          flexShrink: 0,
          display: 'flex',
          borderBottom: '2px solid var(--card-border)',
          background: 'var(--sidebar-bg)',
        }}>
          {['summary', 'transcript'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-dim)',
                fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <main style={{
        flex: 1, overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      }}>
        {hasPreview && (
          <div style={{ borderBottom: '2px solid var(--card-border)' }}>
            <button
              onClick={() => setPreviewOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-main)', fontFamily: 'inherit',
                fontSize: '11px', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              Preview
              {previewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {previewOpen && (
              <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: isPortrait ? '280px' : '100%',
                  aspectRatio: isPortrait ? '9/16' : '16/9',
                  maxHeight: isPortrait ? '420px' : '240px',
                  background: '#1a1a18',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  border: 'var(--border-width) solid var(--border-color)',
                  position: 'relative',
                }}>
                  <VideoPlayer selectedVideo={item} videoRef={null} />
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '20px 16px 0' }}>
        {/* Summary tab (or note content) */}
        {(isNote || activeTab === 'summary') && (
          generating ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '80px', fontSize: '13px', lineHeight: '1.7' }}>
              <Loader2 size={32} className="spin" style={{ color: 'var(--primary)', display: 'block', margin: '0 auto 14px' }} />
              Generating summary…
            </div>
          ) : content ? (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '80px', fontSize: '13px', lineHeight: '1.7', padding: '0 24px' }}>
              <Sparkles size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
              {!isNote && item.status !== 'completed'
                ? 'Summary will be available after this source finishes processing.'
                : 'No summary yet.'}
              {canGenerate && (
                <button onClick={handleGenerate} style={{
                  marginTop: '20px',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px',
                  background: 'var(--primary)', color: 'var(--bg-color)',
                  border: '2px solid var(--card-border)', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', letterSpacing: '0.03em',
                }}>
                  <Sparkles size={14} /> Generate Summary
                </button>
              )}
              {genError && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#d94f4f', fontSize: '12px' }}>
                  <AlertCircle size={13} /> {genError}
                </div>
              )}
            </div>
          )
        )}

        {/* Transcript tab */}
        {!isNote && activeTab === 'transcript' && (
          transcript.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {transcript.map((seg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--card-border)',
                }}>
                  <span style={{
                    flexShrink: 0, fontSize: '11px', fontWeight: 700,
                    color: 'var(--text-dim)', letterSpacing: '0.03em',
                    paddingTop: '2px', minWidth: '36px',
                  }}>
                    {formatTimestamp(seg.start)}
                  </span>
                  <span style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {seg.speech}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '80px', fontSize: '13px', lineHeight: '1.7', padding: '0 24px' }}>
              <FileText size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
              {item.status !== 'completed'
                ? 'Transcript will be available after this source finishes processing.'
                : 'No transcript available for this source.'}
            </div>
          )
        )}
        </div>
      </main>
    </div>
  );
}

export default function MobileCollectionsPage({ initialTab = 'Library' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Shared state
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Library tab state
  const [libSelected, setLibSelected] = useState(null);
  const [libInfoVideo, setLibInfoVideo] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  // Chat tab state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelected, setSearchSelected] = useState(null);
  const [searchInfoVideo, setSearchInfoVideo] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#242424' : '#f0efe9');
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
      const [vRes, nRes] = await Promise.all([getVideos(collectionId), getNotes(collectionId)]);
      setVideos(vRes.data);
      setNotes(nRes.data);
    } catch {}
    finally { setLoading(false); }
  }, [collectionId]);

  useEffect(() => {
    setLoading(true);
    setVideos([]);
    setNotes([]);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const hasProcessing = videos.some(v => !['completed', 'error'].includes(v.status));
    if (!hasProcessing) return;
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [videos, fetchData]);

  const handleCollectionChange = (id) => {
    setCollectionId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setLibSelected(null);
    setSearchSelected(null);
    setSearchQuery('');
    setChatMessages([]);
    setExpandedSources({});
  };

  const videosWithSummary = useMemo(() =>
    videos.map(v => {
      const cleanName = toCleanName(v.originalName);
      return { ...v, _type: 'video', _summary: notes.find(n => n.filename.startsWith(cleanName)) };
    }),
  [videos, notes]);

  const videoCleanNames = useMemo(() => videos.map(v => toCleanName(v.originalName)), [videos]);

  const standaloneNotes = useMemo(() =>
    notes
      .filter(n => !videoCleanNames.some(name => n.filename.startsWith(name)))
      .map(n => ({ ...n, _type: 'note' })),
  [notes, videoCleanNames]);

  const activeCollection = collections.find(c => c.id === collectionId);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading || !collectionId) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setChatLoading(true);
    try {
      const res = await sendChatQuery(text, collectionId);
      const { answer, citations } = res.data;
      setChatMessages(prev => [...prev, { role: 'assistant', text: answer, citations: citations || [] }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.', error: true }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Search computed values
  const q = searchQuery.trim().toLowerCase();

  const videoResults = useMemo(() => {
    if (!q) return [];
    return videosWithSummary.filter(v =>
      v.originalName.toLowerCase().includes(q) || v._summary?.content?.toLowerCase().includes(q)
    );
  }, [q, videosWithSummary]);

  const noteResults = useMemo(() => {
    if (!q) return [];
    return standaloneNotes.filter(n =>
      n.filename.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    );
  }, [q, standaloneNotes]);

  // Detail view overlay — takes full screen
  const detailItem = activeTab === 'Library' ? libSelected : activeTab === 'Search' ? searchSelected : null;
  const clearDetail = () => {
    if (activeTab === 'Library') setLibSelected(null);
    else if (activeTab === 'Search') setSearchSelected(null);
  };

  if (detailItem) {
    return (
      <DetailView
        item={detailItem}
        collectionId={collectionId}
        onBack={clearDetail}
        onRefresh={fetchData}
      />
    );
  }

  const TAB_ICONS = { Library, Chat: MessageSquare, Search: SearchIcon };
  const TabIcon = TAB_ICONS[activeTab];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg-color)', color: 'var(--text-main)',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      overflow: 'hidden',
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
        <TabIcon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
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
            {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute', right: '9px', top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'var(--text-dim)',
          }} />
        </div>
      </header>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Library Tab ── */}
      {activeTab === 'Library' && (
        <main style={{
          flex: 1, overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
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
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '80px', fontSize: '13px', lineHeight: '1.7', padding: '0 32px' }}>
              <Library size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
              {activeCollection ? `No sources in "${activeCollection.title}" yet.` : 'Select a collection to view its sources.'}
            </div>
          ) : (
            <>
              {standaloneNotes.length > 0 && (
                <section>
                  <button
                    onClick={() => setNotesExpanded(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      width: '100%', padding: '16px 16px 8px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', flex: 1 }}>
                      Notes — {standaloneNotes.length}
                    </span>
                    <ChevronDown size={14} style={{ color: 'var(--text-dim)', flexShrink: 0, transform: notesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {notesExpanded && standaloneNotes.map(note => (
                    <button
                      key={note.filename}
                      onClick={() => setLibSelected(note)}
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
                        <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.filename.replace(/_/g, ' ').replace(/\.[^.]+$/, '')}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    </button>
                  ))}
                </section>
              )}
              {videosWithSummary.length > 0 && (
                <section>
                  <button
                    onClick={() => setSourcesExpanded(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      width: '100%', padding: '16px 16px 8px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', flex: 1 }}>
                      Sources — {videosWithSummary.length}
                    </span>
                    <ChevronDown size={14} style={{ color: 'var(--text-dim)', flexShrink: 0, transform: sourcesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                  </button>
                  {sourcesExpanded && videosWithSummary.map(video => (
                    <div key={video.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
                      <div
                        onClick={() => setLibSelected(video)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, padding: '14px 0 14px 16px', cursor: 'pointer' }}
                      >
                        <FileVideo size={18} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        onClick={() => setLibInfoVideo(video)}
                        style={{ background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      )}

      {/* ── Chat Tab ── */}
      {activeTab === 'Chat' && (
        <>
          <main style={{
            flex: 1, overflowY: 'auto',
            WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
            display: 'flex', flexDirection: 'column', gap: '16px',
            padding: '20px 16px',
          }}>
            {chatMessages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.7', padding: '0 24px' }}>
                <MessageSquare size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
                {activeCollection
                  ? <>Ask anything about<br /><strong style={{ color: 'var(--text-main)' }}>{activeCollection.title}</strong></>
                  : 'Select a collection above to start chatting'}
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px' }}>
                <div style={{
                  maxWidth: '88%', padding: '11px 15px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                  border: msg.role === 'user' ? 'none' : '2px solid var(--card-border)',
                  fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ maxWidth: '88%' }}>
                    <button
                      onClick={() => setExpandedSources(prev => ({ ...prev, [i]: !prev[i] }))}
                      style={{
                        background: 'none', border: '1px solid var(--card-border)', borderRadius: '6px',
                        padding: '4px 10px', fontSize: '12px', color: 'var(--text-dim)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit',
                      }}
                    >
                      {expandedSources[i] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''}
                    </button>
                    {expandedSources[i] && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {msg.citations.map((c, ci) => (
                          <div key={ci} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 12px', background: 'var(--card-bg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: c.text ? '6px' : 0, flexWrap: 'wrap' }}>
                              <FileVideo size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.videoName}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-dim)', flexShrink: 0 }}>
                                {new Date(c.timestamp * 1000).toISOString().substring(14, 19)}
                              </span>
                            </div>
                            {c.text && <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.55', color: 'var(--text-main)' }}>{c.text}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '13px' }}>
                <Loader2 size={15} className="spin" />
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer style={{
            flexShrink: 0,
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            background: 'var(--sidebar-bg)',
            borderTop: '2px solid var(--card-border)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-end',
              border: '2px solid var(--card-border)', borderRadius: '16px',
              background: 'var(--card-bg)', padding: '8px 8px 8px 14px', gap: '8px',
            }}>
              <textarea
                ref={textareaRef}
                value={chatInput}
                onChange={e => {
                  setChatInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
                }}
                placeholder={activeCollection ? `Ask about ${activeCollection.title}...` : 'Select a collection first...'}
                disabled={!collectionId}
                rows={1}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  color: 'var(--text-main)', fontSize: '16px', resize: 'none',
                  fontFamily: 'inherit', outline: 'none', lineHeight: '1.5',
                  maxHeight: '120px', overflowY: 'auto', padding: '3px 0',
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatLoading || !collectionId}
                style={{
                  flexShrink: 0, width: '36px', height: '36px', borderRadius: '10px',
                  border: 'none', background: 'var(--primary)', color: 'var(--bg-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: (!chatInput.trim() || chatLoading || !collectionId) ? 0.35 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {chatLoading ? <Loader2 size={16} className="spin" /> : <ArrowUp size={16} />}
              </button>
            </div>
          </footer>
        </>
      )}

      {/* ── Search Tab ── */}
      {activeTab === 'Search' && (
        <>
          <div style={{
            flexShrink: 0, padding: '12px 16px',
            background: 'var(--bg-color)', borderBottom: '1px solid var(--card-border)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              border: '2px solid var(--card-border)', borderRadius: '10px',
              background: 'var(--card-bg)', padding: '0 12px',
            }}>
              <SearchIcon size={15} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sources and notes..."
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  color: 'var(--text-main)', fontFamily: 'inherit',
                  fontSize: '16px', outline: 'none', padding: '11px 0',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <main style={{
            flex: 1, overflowY: 'auto',
            WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px', color: 'var(--text-dim)' }}>
                <Loader2 size={24} className="spin" />
              </div>
            ) : !searchQuery.trim() ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '80px', fontSize: '13px', lineHeight: '1.7', padding: '0 32px' }}>
                <SearchIcon size={36} style={{ opacity: 0.2, display: 'block', margin: '0 auto 14px' }} />
                Search across source names, summaries, and notes.
              </div>
            ) : videoResults.length === 0 && noteResults.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '80px', fontSize: '13px', padding: '0 32px' }}>
                No results for <strong style={{ color: 'var(--text-main)' }}>"{searchQuery}"</strong>
              </div>
            ) : (
              <>
                {videoResults.length > 0 && (
                  <section>
                    <div style={{ padding: '14px 16px 6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                      Sources — {videoResults.length}
                    </div>
                    {videoResults.map(video => {
                      const nameMatch = video.originalName.toLowerCase().includes(q);
                      const summarySnippet = !nameMatch && video._summary?.content ? snippet(video._summary.content, searchQuery) : null;
                      return (
                        <div key={video.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
                          <div
                            onClick={() => setSearchSelected(video)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, padding: '14px 0 14px 16px', cursor: 'pointer' }}
                          >
                            <FileVideo size={18} style={{ color: 'var(--text-dim)', flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Highlight text={video.originalName.replace(/\.[^.]+$/, '')} query={searchQuery} />
                              </div>
                              {summarySnippet && (
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px', lineHeight: '1.5' }}>
                                  <Highlight text={summarySnippet} query={searchQuery} />
                                </div>
                              )}
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                          </div>
                          <button
                            onClick={() => setSearchInfoVideo(video)}
                            style={{ background: 'none', border: 'none', padding: '14px 16px', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
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
                    <div style={{ padding: '14px 16px 6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                      Notes — {noteResults.length}
                    </div>
                    {noteResults.map(note => {
                      const displayName = note.filename.replace(/_/g, ' ').replace(/\.[^.]+$/, '');
                      const contentSnippet = snippet(note.content, searchQuery);
                      return (
                        <button
                          key={note.filename}
                          onClick={() => setSearchSelected(note)}
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
                            <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Highlight text={displayName} query={searchQuery} />
                            </div>
                            {contentSnippet && (
                              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px', lineHeight: '1.5' }}>
                                <Highlight text={contentSnippet} query={searchQuery} />
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
        </>
      )}

      {/* Sheets / overlays */}
      {libInfoVideo && (
        <SourceInfoSheet
          video={libInfoVideo}
          onClose={() => setLibInfoVideo(null)}
          onRetry={async (id) => { await retryVideo(id); fetchData(); }}
          onDelete={async (id) => { await deleteVideoById(id); setLibInfoVideo(null); fetchData(); }}
        />
      )}
      {searchInfoVideo && (
        <SourceInfoSheet
          video={searchInfoVideo}
          onClose={() => setSearchInfoVideo(null)}
          onRetry={async (id) => { await retryVideo(id); fetchData(); }}
          onDelete={async (id) => { await deleteVideoById(id); setSearchInfoVideo(null); fetchData(); }}
        />
      )}
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
