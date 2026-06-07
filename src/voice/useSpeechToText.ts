import { useCallback, useEffect, useRef, useState } from 'react';

/* Web Speech API wrapper. Prototype stand-in for the spec's "pinch + speak":
   start() begins live recognition, each result is delivered to onTranscript as
   the recognised chunk so the caller can append it into the active note.
   Whisper (local, offline) replaces this in the finished product. */

// Minimal typings — the DOM lib does not ship SpeechRecognition.
interface SpeechRecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResult };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechSupported = (): boolean => getCtor() !== null;

interface UseSpeechToText {
  listening: boolean;
  supported: boolean;
  /** id of the note currently capturing speech, or null. */
  activeId: string | null;
  /** Toggle recognition for a note. Stops if that note is already active. */
  toggle: (noteId: string, onTranscript: (chunk: string, isFinal: boolean) => void) => void;
  stop: () => void;
}

export function useSpeechToText(): UseSpeechToText {
  const [listening, setListening] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const manualStopRef = useRef(false);
  const supported = speechSupported();

  const stop = useCallback(() => {
    manualStopRef.current = true;
    recRef.current?.stop();
    recRef.current = null;
    setListening(false);
    setActiveId(null);
  }, []);

  const toggle = useCallback(
    (noteId: string, onTranscript: (chunk: string, isFinal: boolean) => void) => {
      if (recRef.current && activeId === noteId) {
        stop();
        return;
      }
      // switching to a different note — tear down first
      if (recRef.current) stop();

      const Ctor = getCtor();
      if (!Ctor) return;
      manualStopRef.current = false;
      const rec = new Ctor();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          onTranscript(r[0].transcript, r.isFinal);
        }
      };
      rec.onerror = (e) => {
        // 'no-speech' / 'aborted' are transient — onend will auto-restart.
        // Only fatal errors (permission, no mic) tear the session down.
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          stop();
        }
      };
      rec.onend = () => {
        if (recRef.current !== rec) return;
        // Keep listening across the engine's idle timeouts until the user
        // explicitly stops (Escape / switching notes / unmount).
        if (!manualStopRef.current) {
          try {
            rec.start();
            return;
          } catch {
            /* fall through to teardown */
          }
        }
        recRef.current = null;
        setListening(false);
        setActiveId(null);
      };
      recRef.current = rec;
      setActiveId(noteId);
      setListening(true);
      rec.start();
    },
    [activeId, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, activeId, toggle, stop };
}
