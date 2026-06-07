# Mindboard

An infinite, spatial whiteboard designed around **Natural User Interface (NUI)** principles — where "the body is the interface." Built for the HTW Berlin NUI module.

Mindboard replaces traditional UI chrome, mouse clicks, and complex hotkeys with direct spatial manipulation and voice. It acts as an extension of physical space, enabling free-form organization of thoughts through gestures and spoken word.

---

## NUI Design Philosophy

The core vision of Mindboard is to create a quiet, distraction-free environment that maximizes human cognitive bandwidth. The interaction design is built on three pillars:

### 1. Spatial & Zero-Clutter Interface
- **Infinite Dot-Grid Canvas**: Pan and zoom smoothly to organize your thoughts as you would on a physical workbench.
- **No Toolbars or Floating UI**: All controls are contextual or gesture-driven, keeping the focus entirely on your content.
- **Minimal Visual Noise**: Glitch animations and blurred glows have been replaced with sharp, high-contrast borders and transitions that respect the user's attention.
- **Subtle Corner Resize Indicator**: Bounding box resize frames have been replaced by a quiet diagonal bracket in the bottom-right corner of each node, showing capability without visual clutter.

### 2. Natural Drag & Edit Interactions
- **One-Click Dragging**: Click anywhere on a note node and move the mouse to position it spatially. Text areas remain passive until selected, allowing frictionless physical reorganization of notes.
- **Double-Click to Edit**: Double-clicking a note node instantly makes its content editable, focusing the cursor and placing it at the end of the text.
- **Seamless Saving**: Pressing `Enter` (without `Shift`), `Escape`, or clicking outside saves the note and returns it to the passive, draggable state.

### 3. Voice-First Input
- **Instant Dictation**: Creating a new note automatically begins a speech-to-text dictation session.
- **Contextual Transcripts**: Spoken words are captured live and appended to the active node, converting voice directly into persistent spatial notes.

---

## Technology Stack

- **Framework**: Vite + React + TypeScript
- **Infinite Canvas**: [@xyflow/react](https://reactflow.dev) (React Flow v12)
- **State Management**: Zustand, persisted automatically to `localStorage`
- **Voice Recognition**: Web Speech API (transcribes live speech directly in Chromium-based browsers)
- **Hand Tracking (Phase B)**: MediaPipe Hands integration to map finger pinches to spatial actions

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser at the local server address (typically `http://localhost:5173`).

### 3. Build for Production
```bash
npm run build
```
This will compile the TypeScript files and generate a performance-optimized production bundle in the `dist` folder.
