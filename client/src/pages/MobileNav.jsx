import { Library, MessageSquare, Search } from 'lucide-react';

const TABS = [
  { label: 'Library', icon: Library },
  { label: 'Chat',    icon: MessageSquare },
  { label: 'Search',  icon: Search },
];

export default function MobileNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      display: 'flex',
      flexShrink: 0,
      borderBottom: '2px solid var(--card-border)',
      background: 'var(--sidebar-bg)',
    }}>
      {TABS.map(({ label, icon: Icon }) => {
        const isActive = activeTab === label;
        return (
          <button
            key={label}
            onClick={() => onTabChange(label)}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              padding: '10px 4px',
              fontSize: '11px', fontWeight: isActive ? 700 : 400,
              color: isActive ? 'var(--text-main)' : 'var(--text-dim)',
              background: 'none', border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              letterSpacing: '0.03em',
              cursor: 'pointer',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
