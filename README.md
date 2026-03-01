# p5studio

**p5.js live preview and MP4 renderer — built for creative coding with Claude Code.**

[![npm version](https://img.shields.io/npm/v/p5studio)](https://www.npmjs.com/package/p5studio)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

<!-- TODO: Add demo GIF here -->
<!-- ![demo](docs/demo.gif) -->

---

## What is p5studio?

p5studio is a CLI tool that gives your p5.js sketches two superpowers:

- **Live preview** — edit your sketch and the browser auto-reloads instantly
- **MP4 export** — render your animation to a high-quality video file

It is designed to work seamlessly with **Claude Code**, so you can describe the art you want and let AI write the sketch while you focus on the creative vision.

```
Your idea
   │
   ↓  (Claude Code writes the sketch)
sketches/my-art.js
   │
   ├── p5studio dev    →  browser live preview
   └── p5studio render →  out/my-art.mp4
```

---

## Features

- ✅ Hot-reload live preview via WebSocket
- ✅ Frame-accurate MP4 rendering with Puppeteer + ffmpeg
- ✅ Global/instance mode p5.js auto-detection
- ✅ Project defaults via `p5studio.config.js`
- ✅ Claude Code integration (CLAUDE.md + skills)

---

## Requirements

- **Node.js** v18 or later
- **ffmpeg** — install with `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)

---

## Installation

```bash
npm install -g p5studio
```

Or use without installing:

```bash
npx p5studio init my-art
```

---

## Quick Start

```bash
# 1. Create a new project
p5studio init my-art
cd my-art

# 2. Start live preview
p5studio dev sketches/example.js

# 3. Edit the sketch — the browser auto-reloads on save

# 4. Export to MP4
p5studio render sketches/example.js
# → out/example.mp4
```

---

## Commands

### `p5studio dev [sketch]`

Starts a live preview server at `http://localhost:3000`.

```bash
p5studio dev sketches/my-art.js
p5studio dev sketches/my-art.js --port 8080
```

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --port` | `3000` | Port number |

### `p5studio render <sketch>`

Renders the sketch to an MP4 file using Puppeteer + ffmpeg.

```bash
p5studio render sketches/my-art.js
p5studio render sketches/my-art.js --output out/final.mp4
p5studio render sketches/my-art.js --timeout 60000
```

| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output` | `out/<name>.mp4` | Output file path |
| `--timeout` | `30000` | Frame render timeout (ms) |

### `p5studio init [name]`

Scaffolds a new p5studio project with CLAUDE.md and example sketch.

```bash
p5studio init my-art
```

---

## Writing Sketches

### Metadata comment

Add this to the **first line** of your sketch to control render settings:

```javascript
// @p5studio fps=30 duration=6 width=1080 height=1080
```

| Key | Default | Description |
|-----|---------|-------------|
| `fps` | `30` | Frames per second |
| `duration` | `6` | Duration in seconds |
| `width` | `1280` | Canvas width (px) |
| `height` | `720` | Canvas height (px) |

### Use `frameCount`, not `millis()`

p5studio renders frame-by-frame, so always use `frameCount` for time-based animation:

```javascript
// @p5studio fps=30 duration=6 width=1080 height=1080

function setup() {
  createCanvas(1080, 1080);
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  background(0, 0, 0, 20);
  translate(width / 2, height / 2);

  // t goes from 0.0 to 1.0 over the full duration
  const t = frameCount / (30 * 6);

  // ... your art here
}
```

> ⚠️ **Do not use** `millis()`, `Date.now()`, or `random()` without a seed.
> These produce different results each render and will break your animation.

---

## Project-wide Defaults (`p5studio.config.js`)

Place a `p5studio.config.js` at your project root to set defaults for **all** sketches:

```javascript
// p5studio.config.js
export default {
  fps: 30,
  duration: 6,
  width: 1080,   // square — great for Instagram/X
  height: 1080,
};
```

Priority (highest wins): **sketch comment > p5studio.config.js > built-in defaults**

---

## Claude Code Integration

p5studio is built for AI-assisted creative coding. When you run `p5studio init`, it generates:

- `CLAUDE.md` — teaches Claude the p5studio conventions
- `.claude/skills/new-sketch/` — `/new-sketch` slash command
- `.claude/skills/render/` — `/render` slash command

**Typical workflow with Claude Code:**

```
You:    "Create a Lissajous curve animation with glowing lines"
Claude: writes sketches/lissajous.js
You:    /render lissajous
Claude: runs p5studio render → out/lissajous.mp4
You:    evaluate the video, fill in feedback.md
You:    "The motion is too fast, reduce speed by half"
Claude: edits the sketch
You:    /render lissajous  (repeat)
```

---

## How It Works

```
p5studio dev
  └── Express server  (serves sketch as HTML)
  └── chokidar        (watches file changes)
  └── WebSocket       (notifies browser to reload)

p5studio render
  └── parseMetadata()   (reads // @p5studio comment)
  └── Puppeteer         (headless Chrome runs the sketch)
  └── frame loop        (captures canvas as PNG per frame)
  └── ffmpeg            (encodes PNGs → MP4)
```

---

## License

MIT — see [LICENSE](./LICENSE)
