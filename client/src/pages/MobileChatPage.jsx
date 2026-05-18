import { useState, useEffect, useRef } from 'react';
import { getCollections } from '../services/collectionsService';
import { sendChatQuery } from '../services/chatService';
import { MessageSquare, ArrowUp, Loader2, FileVideo, ChevronDown, ChevronRight } from 'lucide-react';
import MobileNav from './MobileNav';

const STORAGE_KEY = 'opennote-active-collection';

export default function MobileChatPage() {
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    getCollections().then(res => {
      const cols = res.data;
      setCollections(cols);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored && cols.length > 0) {
        setCollectionId(cols[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !collectionId) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await sendChatQuery(text, collectionId);
      const { answer, citations } = res.data;
      setMessages(prev => [...prev, { role: 'assistant', text: answer, citations: citations || [] }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCollectionChange = (id) => {
    setCollectionId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setMessages([]);
    setExpandedSources({});
  };

  const activeCollection = collections.find(c => c.id === collectionId);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-color)',
      color: 'var(--text-main)',
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    }}>

      {/* Header */}
      <header style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        background: 'var(--sidebar-bg)',
        borderBottom: '2px solid var(--card-border)',
      }}>
        <MessageSquare size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.03em', flexShrink: 0 }}>
          OpenNote
        </span>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <select
            value={collectionId}
            onChange={e => handleCollectionChange(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 28px 4px 10px',
              border: '2px solid var(--card-border)',
              borderRadius: '8px',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
              fontSize: '16px',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {collections.length === 0 && <option value="">Loading collections...</option>}
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            style={{
              position: 'absolute',
              right: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--text-dim)',
            }}
          />
        </div>
      </header>

      <MobileNav active="Chat" />

      {/* Messages */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px 16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '13px',
            lineHeight: '1.7',
            padding: '0 24px',
          }}>
            <MessageSquare size={36} style={{ opacity: 0.2, marginBottom: '14px', display: 'block', margin: '0 auto 14px' }} />
            {activeCollection
              ? <>Ask anything about<br /><strong style={{ color: 'var(--text-main)' }}>{activeCollection.title}</strong></>
              : 'Select a collection above to start chatting'}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '8px',
            }}
          >
            <div style={{
              maxWidth: '88%',
              padding: '11px 15px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
              border: msg.role === 'user' ? 'none' : '2px solid var(--card-border)',
              fontSize: '14px',
              lineHeight: '1.65',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.text}
            </div>

            {msg.citations && msg.citations.length > 0 && (
              <div style={{ maxWidth: '88%' }}>
                <button
                  onClick={() => setExpandedSources(prev => ({ ...prev, [i]: !prev[i] }))}
                  style={{
                    background: 'none',
                    border: '1px solid var(--card-border)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: 'inherit',
                  }}
                >
                  {expandedSources[i] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''}
                </button>

                {expandedSources[i] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {msg.citations.map((c, ci) => (
                      <div
                        key={ci}
                        style={{
                          border: '1px solid var(--card-border)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          background: 'var(--card-bg)',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: c.text ? '6px' : 0,
                          flexWrap: 'wrap',
                        }}>
                          <FileVideo size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.videoName}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', flexShrink: 0 }}>
                            {new Date(c.timestamp * 1000).toISOString().substring(14, 19)}
                          </span>
                        </div>
                        {c.text && (
                          <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.55', color: 'var(--text-main)' }}>
                            {c.text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '13px' }}>
            <Loader2 size={15} className="spin" />
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer style={{
        flexShrink: 0,
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        background: 'var(--sidebar-bg)',
        borderTop: '2px solid var(--card-border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          border: '2px solid var(--card-border)',
          borderRadius: '16px',
          background: 'var(--card-bg)',
          padding: '8px 8px 8px 14px',
          gap: '8px',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={activeCollection ? `Ask about ${activeCollection.title}...` : 'Select a collection first...'}
            disabled={!collectionId}
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              fontSize: '16px',
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
              lineHeight: '1.5',
              maxHeight: '120px',
              overflowY: 'auto',
              padding: '3px 0',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || !collectionId}
            style={{
              flexShrink: 0,
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--bg-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: (!input.trim() || loading || !collectionId) ? 0.35 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
      </footer>
    </div>
  );
}
