import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NodeResizeControl, type NodeProps } from '@xyflow/react';
import { useBoardStore } from '../../store/boardStore';
import { useVoice } from '../../voice/VoiceContext';
import './NoteNode.css';

export interface NoteNodeData extends Record<string, unknown> {
  text: string;
}

/* Pure text note — no header, no connectors. Just an editable card. Dictation
   auto-starts when the note is created (spec: pinch + speak); a recording glow
   shows it is listening. Stop with Escape (or by creating another note).
   Delete via right-click on the canvas. */
function NoteNodeImpl({ id, data, selected }: NodeProps) {
  const text = (data as NoteNodeData).text ?? '';
  const updateNote = useBoardStore((s) => s.updateNote);
  const autoRecordId = useBoardStore((s) => s.autoRecordId);
  const clearAutoRecord = useBoardStore((s) => s.clearAutoRecord);
  const voice = useVoice();
  const recording = voice.activeId === id && voice.listening;

  const [isEditing, setIsEditing] = useState(autoRecordId === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Snapshot of the note's text when recording started + finals committed this
  // session, so interim results don't duplicate as they grow.
  const baseRef = useRef('');
  const committedRef = useRef('');

  const onTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNote(id, { text: e.target.value });
    },
    [id, updateNote],
  );

  const startDictation = useCallback(() => {
    baseRef.current = text ? text.replace(/\s*$/, '') + ' ' : '';
    committedRef.current = '';
    voice.toggle(id, (chunk, isFinal) => {
      if (isFinal) committedRef.current += chunk.trim() + ' ';
      const interim = isFinal ? '' : chunk;
      updateNote(id, { text: (baseRef.current + committedRef.current + interim).trimEnd() });
    });
  }, [id, text, updateNote, voice]);

  // Auto-start dictation right after this note is created.
  useEffect(() => {
    if (autoRecordId !== id) return;
    clearAutoRecord(id);
    setIsEditing(true);
    if (voice.supported) startDictation();
    // run once when flagged as the freshly-created note
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRecordId, id, clearAutoRecord, voice.supported]);

  // Mic button toggles dictation on the selected note.
  const onToggleRec = useCallback(() => {
    if (recording) voice.stop();
    else startDictation();
  }, [recording, voice, startDictation]);

  // Enter saves + stops recording (Shift+Enter inserts a newline). Save is
  // already automatic via onChange; here Enter also ends dictation and blurs.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (recording) voice.stop();
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (recording) voice.stop();
        setIsEditing(false);
      }
    },
    [recording, voice],
  );

  const onBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Auto-focus and move cursor to the end when entering edit mode.
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Show the record button while recording, or when the note is selected.
  const showBadge = recording || selected;

  return (
    <div
      className={`mb-note${recording ? ' mb-note--rec' : ''}`}
      onDoubleClick={onDoubleClick}
    >
      <NodeResizeControl
        className="mb-note__resize-control"
        minWidth={160}
        minHeight={90}
        position="bottom-right"
      >
        <svg
          className="mb-note__resize-svg"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <line x1="9" y1="3" x2="3" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="9" y1="6" x2="6" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </NodeResizeControl>

      {showBadge && voice.supported && (
        <button
          type="button"
          className={`mb-note__rec-badge nodrag${recording ? '' : ' mb-note__rec-badge--idle'}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          title={recording ? 'Recording — click or press Esc to stop' : 'Click to dictate'}
          onClick={onToggleRec}
        >
          <span className="mb-note__rec-dot" />
        </button>
      )}

      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="mb-note__textarea nodrag nowheel"
          value={text}
          onChange={onTextChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder="Type or dictate…"
          spellCheck={false}
        />
      ) : (
        <div className="mb-note__text-display">
          {text || <span className="mb-note__placeholder">Type or dictate…</span>}
        </div>
      )}
    </div>
  );
}

export const NoteNode = memo(NoteNodeImpl);
