import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  applyNodeChanges,
  useReactFlow,
  type Node as RFNode,
  type NodeChange,
  type Viewport as RFViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBoardStore } from '../store/boardStore';
import { NODE_TYPES } from './nodeTypes';
import type { NoteNodeData } from '../nodes/NoteNode/NoteNode';

type MBNode = RFNode<NoteNodeData>;

export const DEFAULT_NOTE_W = 220;
export const DEFAULT_NOTE_H = 130;

/* Lean infinite canvas. ReactFlow config + dual-density dot grid + trackpad
   pan/zoom flags adapted from KRNL0 CanvasFlow.tsx; productivity domain dropped.
   Store is the source of truth; RF owns the live copy during drags. */
export function Canvas() {
  const notes = useBoardStore((s) => s.notes);
  const viewport = useBoardStore((s) => s.viewport);
  const updateNote = useBoardStore((s) => s.updateNote);
  const addNote = useBoardStore((s) => s.addNote);
  const removeNote = useBoardStore((s) => s.removeNote);
  const selectNote = useBoardStore((s) => s.selectNote);
  const setViewport = useBoardStore((s) => s.setViewport);
  const { screenToFlowPosition } = useReactFlow();

  // Right-click context menu (delete). Pinned to screen coords of the event.
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; ids: string[] } | null>(null);
  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: MBNode) => {
    e.preventDefault();
    // If the clicked node is part of a multi-selection, target the whole selection.
    setRfNodes((nds) => {
      const selected = nds.filter((n) => n.selected).map((n) => n.id);
      const ids = selected.length > 1 && selected.includes(node.id) ? selected : [node.id];
      setCtxMenu({ x: e.clientX, y: e.clientY, ids });
      return nds;
    });
  }, []);

  useEffect(() => {
    if (!ctxMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCtxMenu();
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', closeCtxMenu);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', closeCtxMenu);
    };
  }, [ctxMenu, closeCtxMenu]);

  // Derive RF nodes from store. Identity churn is fine at prototype scale.
  const derived = useMemo<MBNode[]>(
    () =>
      notes.map((n) => ({
        id: n.id,
        type: 'note',
        position: { x: n.x, y: n.y },
        data: { text: n.text },
        width: n.width ?? DEFAULT_NOTE_W,
        height: n.height ?? DEFAULT_NOTE_H,
        style: { width: n.width ?? DEFAULT_NOTE_W, height: n.height ?? DEFAULT_NOTE_H },
      })),
    [notes],
  );

  const [rfNodes, setRfNodes] = useState<MBNode[]>(derived);
  const draggingRef = useRef(false);

  // Sync store → local, except while dragging (avoids fighting RF's live copy).
  useEffect(() => {
    if (!draggingRef.current) setRfNodes(derived);
  }, [derived]);

  const onNodesChange = useCallback(
    (changes: NodeChange<MBNode>[]) => {
      setRfNodes((nds) => applyNodeChanges(changes, nds));
      for (const c of changes) {
        if (c.type === 'position') {
          if (c.dragging === true) {
            draggingRef.current = true;
          } else if (c.dragging === false) {
            draggingRef.current = false;
            if (c.position) updateNote(c.id, { x: c.position.x, y: c.position.y });
          }
        } else if (c.type === 'remove') {
          // Delete/Backspace key — remove every selected node from the store.
          removeNote(c.id);
        } else if (c.type === 'dimensions' && c.resizing === false && c.dimensions) {
          // Persist size when a NodeResizer drag ends.
          updateNote(c.id, { width: c.dimensions.width, height: c.dimensions.height });
        }
      }
    },
    [updateNote, removeNote],
  );

  // Double-click empty canvas → new note at cursor (spec: "pinch empty = new note").
  const onPaneDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only the empty pane, not a note or control, spawns a note.
      if (!(e.target as HTMLElement).classList.contains('react-flow__pane')) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNote(pos.x - 110, pos.y - 60);
    },
    [addNote, screenToFlowPosition],
  );

  const onMoveEnd = useCallback(
    (_e: unknown, v: RFViewport) => setViewport({ x: v.x, y: v.y, zoom: v.zoom }),
    [setViewport],
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: MBNode[] }) => selectNote(nodes.length === 1 ? nodes[0]!.id : null),
    [selectNote],
  );

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={[]}
      nodeTypes={NODE_TYPES}
      defaultViewport={viewport}
      onNodesChange={onNodesChange}
      onDoubleClick={onPaneDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      onPaneClick={closeCtxMenu}
      onMoveEnd={onMoveEnd}
      onSelectionChange={onSelectionChange}
      deleteKeyCode={['Backspace', 'Delete']}
      selectionOnDrag
      multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
      panOnDrag={[1, 2]}
      panOnScroll
      panOnScrollSpeed={0.8}
      zoomOnScroll
      zoomOnPinch
      zoomActivationKeyCode={['Meta', 'Control']}
      panActivationKeyCode={null}
      minZoom={0.25}
      maxZoom={4}
      zoomOnDoubleClick={false}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'var(--paper)' }}
    >
      <Background id="mb-grid-minor" variant={BackgroundVariant.Dots} gap={32} size={1.6} color="var(--grid)" />
      <Background id="mb-grid-major" variant={BackgroundVariant.Dots} gap={160} size={3.6} color="var(--grid-strong)" />
      <Controls position="bottom-left" showInteractive={false} />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        nodeColor="var(--paper-3)"
        nodeStrokeWidth={2}
        maskColor="rgba(14, 13, 11, 0.55)"
        style={{ width: 160, height: 120 }}
      />

      {ctxMenu && (
        <div
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            background: 'var(--node-bg)',
            border: '1px solid var(--paper-3)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: 4,
            zIndex: 1000,
            minWidth: 130,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <button
            type="button"
            onClick={() => {
              ctxMenu.ids.forEach((id) => removeNote(id));
              closeCtxMenu();
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '6px 10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--rust)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,85,61,0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {ctxMenu.ids.length > 1 ? `Delete ${ctxMenu.ids.length} notes` : 'Delete note'}
          </button>
        </div>
      )}
    </ReactFlow>
  );
}
