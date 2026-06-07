import { useStore } from '@xyflow/react';
import { useBoardStore } from '../store/boardStore';
import { useVoice } from '../voice/VoiceContext';

/* KRNL0-style bottom status strip: zoom %, note count, voice state, hint. */
export function StatusBar() {
  const zoom = useStore((s) => s.transform[2]);
  const count = useBoardStore((s) => s.notes.length);
  const voice = useVoice();

  const barStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '0 12px',
    background: 'var(--paper-2)',
    borderTop: '1px solid var(--paper-3)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--ink-3)',
    textTransform: 'uppercase',
    zIndex: 10,
  };

  return (
    <footer style={barStyle}>
      <span>{Math.round(zoom * 100)}%</span>
      <span>{count} note{count === 1 ? '' : 's'}</span>
      {voice.listening && <span style={{ color: 'var(--acid)' }}>● rec</span>}
      <span style={{ flex: 1 }} />
      <span style={{ color: 'var(--ink-4)' }}>
        double-click canvas → new note (auto-dictates) · esc stops · right-click → delete
      </span>
    </footer>
  );
}
