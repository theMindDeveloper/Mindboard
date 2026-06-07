import { useReactFlow } from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';

/* KRNL0-style top chrome: 44px bar, mono label, FIT + theme toggle. */
export function TopBar() {
  const { fitView } = useReactFlow();
  const theme = useBoardStore((s) => s.theme);
  const setTheme = useBoardStore((s) => s.setTheme);

  const barStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '0 14px',
    background: 'var(--paper-2)',
    borderBottom: '1px solid var(--paper-3)',
    fontFamily: 'var(--font-mono)',
    zIndex: 10,
  };

  const btn: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--paper-3)',
    color: 'var(--ink-2)',
    borderRadius: 'var(--radius)',
    padding: '4px 10px',
    fontFamily: 'inherit',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };

  return (
    <header style={barStyle}>
      <span style={{ fontWeight: 700, letterSpacing: '0.18em', fontSize: 13 }}>MINDBOARD</span>
      <span style={{ color: 'var(--ink-4)', fontSize: 10, letterSpacing: '0.08em' }}>
        infinite whiteboard · gesture + voice
      </span>
      <span style={{ flex: 1 }} />
      <button type="button" style={btn} onClick={() => fitView({ padding: 0.2, duration: 300 })}>
        Fit
      </button>
      <button
        type="button"
        style={btn}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title="Toggle theme"
      >
        {theme === 'dark' ? '◐ dark' : '◑ light'}
      </button>
    </header>
  );
}
