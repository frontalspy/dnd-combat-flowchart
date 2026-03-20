# D&D Combat Flowchart Builder

A static React app for building visual combat decision flowcharts for your D&D 5e character.

**Live app:** https://frontalspy.github.io/dnd-combat-flowchart/

D&D icons from https://github.com/intrinsical/tw-dnd/

---

## What it does

Pick your class, subclass, and level, then drag spells, actions, weapons, and conditions onto a canvas to build a step-by-step decision tree for your turn in combat. The result is a shareable, exportable flowchart you can reference at the table.

---

## Features

### Canvas & Nodes
- **Drag-and-drop canvas** powered by React Flow — connect nodes with edges to model branching decisions
- **Multiple node types:** Action/Spell nodes, diamond Condition nodes ("Is the target within 30ft?"), a Combat Start node, free-text Note nodes, Condition/Status Effect nodes (all 15 D&D 5e conditions), and Conditional Group nodes for ability bundles (e.g. Smite variants)
- **Side handles** on every node — connect from top, bottom, left, or right
- **Edge angle snapping** and an animated edges toggle (⚡)
- **Multi-select** nodes to move or delete them together
- **Inline edge label editing** — double-click any edge to add a label

### Spells & Actions
- **455 spells** from SRD, Xanathar's Guide (XGtE), and Tasha's Cauldron (TCoE) — filterable by school, level, class, and source book
- **Class actions** for all 12 classes with level gates (e.g. Action Surge only appears at Fighter level 2+)
- **Standard actions** (Attack, Dodge, Dash, Disengage, Help, Hide, Ready, Use Object)
- **Suggested Groups** — pre-built ability bundles dragged onto the canvas as a single chip (Paladin smites, Warlock invocations, Monk ki, etc.)
- **Damage dice & roll type** shown on each Action node (damage dice, save DC, advantage/disadvantage)
- **Resource cost badges** on nodes (spell slot, ki, rage, superiority die, channel divinity, etc.) — auto-populated for spells, manually set for class abilities

### Weapons
- Full SRD weapon list with drag-and-drop onto the canvas
- **Weapon loadout picker** — assign main-hand, off-hand, two-handed, and shield slots; MH/OH badges appear on weapon nodes

### Character Tracking HUDs
- **Spell Slot Tracker** — click to spend and restore slots; Warlock shows Pact Magic; persists across reloads
- **Concentration Tracker** — flags any two concentration spells that appear on the same path with a red glow and a warning banner
- **Action Economy HUD** — analyses every decision path in your chart; turns red if any path exceeds the per-turn budget (1 action, 1 bonus action, 1 reaction)

### Multi-Tab & Persistence
- **Multiple tabs** — open several character builds side-by-side, switch or close them like browser tabs
- All charts auto-save to `localStorage`; survive page reload

### Sharing & Export
- **Share via URL** — compresses the entire chart into a URL parameter; paste the link to open the chart on any device (no account or server required)
- **Export as JPG / PDF** — captures the canvas via `html-to-image` and wraps it in jsPDF
- **Print reference card** — renders a condensed, ink-optimised A5 landscape card and downloads it as PDF or opens the system print dialog

### Keyboard Shortcuts
- `Ctrl+Z` / `Ctrl+Y` — undo / redo
- `Ctrl+C` / `Ctrl+V` — copy / paste selected nodes
- `Delete` / `Backspace` — delete selected nodes or edges
- `Ctrl+A` — select all nodes

---

## Getting started

```bash
npm install
npm run start:app   # Vite dev server
```

Open [http://localhost:5173](http://localhost:5173).

### Other commands

```bash
npm start       # Vite + Express concurrently
npm test        # Vitest unit tests
npm run build   # Production build → dist/
```

---

## Tech stack

| Tool | Role |
|---|---|
| React 19 | UI framework |
| Vite 7 | Build tool |
| TypeScript 5.9 | Strict typing |
| `@xyflow/react` 12 | Flowchart canvas |
| `html-to-image` | Canvas → PNG capture |
| `jsPDF` | PNG → PDF export |
| `lz-string` | URL share compression |
| Biome | Linting & formatting |
| Vitest | Unit tests |