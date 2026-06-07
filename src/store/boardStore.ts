import { create } from 'zustand';

/* ── Types ──────────────────────────────────────────────────────────────────
   Lean board model adapted from KRNL0's boardStore pattern (single source of
   truth + selectors), trimmed to Mindboard's scope: free notes + viewport.
   Persisted to localStorage instead of IPC/board.json. */

export interface NoteData {
  id: string;
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface Board {
  version: 1;
  notes: NoteData[];
  viewport: Viewport;
}

const STORAGE_KEY = 'mindboard-board-v1';
const THEME_KEY = 'mindboard-theme';
const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

function loadBoard(): Board {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Board;
      if (parsed && Array.isArray(parsed.notes)) {
        return {
          version: 1,
          notes: parsed.notes,
          viewport: parsed.viewport ?? INITIAL_VIEWPORT,
        };
      }
    }
  } catch {
    /* corrupt storage — fall through to empty board */
  }
  return { version: 1, notes: [], viewport: INITIAL_VIEWPORT };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(notes: NoteData[], viewport: Viewport): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const board: Board = { version: 1, notes, viewport };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    } catch {
      /* quota / private mode — silently skip */
    }
  }, 250);
}

export function loadTheme(): 'light' | 'dark' {
  const t = localStorage.getItem(THEME_KEY);
  return t === 'light' ? 'light' : 'dark';
}

function newId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface BoardStore {
  notes: NoteData[];
  viewport: Viewport;
  theme: 'light' | 'dark';
  selectedId: string | null;
  /** id of a freshly-created note that should auto-start dictation, or null. */
  autoRecordId: string | null;

  addNote: (x: number, y: number, text?: string) => string;
  updateNote: (id: string, patch: Partial<Omit<NoteData, 'id'>>) => void;
  removeNote: (id: string) => void;
  setViewport: (v: Viewport) => void;
  selectNote: (id: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearAutoRecord: (id: string) => void;
}

const initial = loadBoard();

export const useBoardStore = create<BoardStore>((set, get) => ({
  notes: initial.notes,
  viewport: initial.viewport,
  theme: loadTheme(),
  selectedId: null,
  autoRecordId: null,

  addNote: (x, y, text = '') => {
    const id = newId();
    const note: NoteData = { id, x, y, text };
    const notes = [...get().notes, note];
    set({ notes, selectedId: id, autoRecordId: id });
    persist(notes, get().viewport);
    return id;
  },

  updateNote: (id, patch) => {
    const notes = get().notes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    set({ notes });
    persist(notes, get().viewport);
  },

  removeNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    const selectedId = get().selectedId === id ? null : get().selectedId;
    set({ notes, selectedId });
    persist(notes, get().viewport);
  },

  setViewport: (viewport) => {
    set({ viewport });
    persist(get().notes, viewport);
  },

  selectNote: (selectedId) => set({ selectedId }),

  clearAutoRecord: (id) =>
    set((s) => (s.autoRecordId === id ? { autoRecordId: null } : {})),

  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  },
}));
