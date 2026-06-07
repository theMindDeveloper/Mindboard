import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './canvas/Canvas';
import { TopBar } from './components/TopBar';
import { StatusBar } from './components/StatusBar';
import { VoiceContext } from './voice/VoiceContext';
import { useSpeechToText } from './voice/useSpeechToText';

export function App() {
  // One recognition session shared across the board (the spec dictates into the
  // single grabbed/active note); provided via context to NoteNode + StatusBar.
  const voice = useSpeechToText();

  // Escape stops dictation (there is no per-note mic button anymore).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && voice.listening) voice.stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voice]);

  return (
    <VoiceContext.Provider value={voice}>
      <ReactFlowProvider>
        <div style={{ position: 'fixed', inset: 0, paddingTop: 44, paddingBottom: 24 }}>
          <Canvas />
        </div>
        <TopBar />
        <StatusBar />
      </ReactFlowProvider>
    </VoiceContext.Provider>
  );
}
