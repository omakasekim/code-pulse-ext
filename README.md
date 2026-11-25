# code-pulse-ext

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-F43F5E?style=for-the-badge)](https://omakasekim.github.io/code-pulse-ext/)
[![Chrome MV3](https://img.shields.io/badge/Plugin-Chrome%20MV3%20%2B%20CLI-0EA5E9?style=for-the-badge)](#plugin-installation)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

> **Subsystem/React/Vue/Flutter/TensorFlow Blast-Radius Graph, JS Scope/Closure/Prototype X-Ray & Commit Cadence / 996 Burnout Heatmap** for high-velocity engineering teams.

## Target GitHub Ecosystems

| Ecosystem | Capability in `code-pulse-ext` |
| --- | --- |
| `facebook/react` · `vuejs/core` · `flutter/flutter` | Click any store/widget to trace downstream re-render & constraint propagation hops |
| `torvalds/linux` · `tensorflow/tensorflow` | Kernel `MAINTAINERS` owner impact + live batch-size tensor shape & FP16 VRAM calculator |
| `getify/You-Dont-Know-JS` | Step-by-step Lexical Environment, Closure retention, `[[Prototype]]` delegation, and `this` binding X-Ray |
| `996icu/996.ICU` | 7×24 commit cadence heatmap with after-hours crunch, bus-factor concentration, and SVG badge export |

## Architecture

```mermaid
flowchart LR
  A[Framework / Kernel / JS / Git Metrics] --> B[codePulseEngine.ts]
  B --> C[Blast-Radius & Tensor Graph]
  B --> D[JS Scope & Prototype Stepper]
  B --> E[7x24 Cadence & Burnout Heatmap]
  C & D & E --> F[WorkbenchShell: ⌘K · #state= · SVG/PNG/MD/JSON]
```

## Quickstart

```bash
npm install
npm run dev
```

Run tests and production build:

```bash
npm test && npm run build
```

## Plugin Installation

1. **Chrome MV3 Extension (`plugin/`)**: Load `./plugin` unpacked via `chrome://extensions` with Developer Mode enabled.
2. **CLI Companion**:
   ```bash
   node plugin/cli.mjs --demo
   ```

## License

[MIT](LICENSE)
