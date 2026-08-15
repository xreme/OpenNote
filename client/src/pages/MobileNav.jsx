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
      gap: '6px',
      flexShrink: 0,
      padding: '10px 14px',
      borderBottom: '1px solid var(--card-border)',
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              height: '38px',
              padding: '0 10px',
              fontSize: '12.5px', fontWeight: 700,
              color: isActive ? 'var(--on-primary)' : 'var(--text-dim)',
              background: isActive ? 'var(--primary)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
