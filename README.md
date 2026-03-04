# IITC Nexus

Full-viewport sci-fi dashboard overlay for [IITC](https://iitc.app/). Replaces the default Intel map UI with a grid-based cyberpunk interface featuring real-time portal data, faction scores, COMM feed, and more.

## Features

- **CSS Grid layout** — 3-column dashboard (left panel, map, right panel) + topbar + bottom panel
- **RES / ENL themes** — Resistance (cyan/blue) and Enlightened (green) with neon glow effects, toggle in topbar
- **Portal List** — all visible portals with search, level filters, distance sorting
- **Portal Detail** — 3-column view: image, info + resonators, mods (2x2)
- **COMM Widget** — real-time chat with ALL / FACTION / ALERTS tabs
- **Bookmarks** — integration with IITC bookmarks plugin
- **Toolbox** — mirrors IITC toolbox links
- **Top Agents** — top 3 agents from region score data
- **Septicycle** — current cycle progress visualization
- **Cell Stats** — S2 cell MU scores (total + last checkpoint)
- **Checkpoint Scores** — per-checkpoint ENL/RES breakdown
- **Collapsible widgets** — all panels can be collapsed/expanded
- **CRT boot screen** — animated loading screen on startup

## Tech Stack

- **[Preact](https://preactjs.com/)** + **[Preact Signals](https://preactjs.com/guide/v10/signals/)** — UI rendering & reactive state
- **[Vite](https://vitejs.dev/)** — build tooling, IIFE output for userscript format
- **CSS Modules** — scoped component styles
- **[Storybook 8](https://storybook.js.org/)** — component development (dev only)
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — linting & formatting

## Installation

```bash
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build → `dist/iitc-nexus.user.js` |
| `npm run dev` | Watch mode (rebuilds on file changes) |
| `npm run storybook` | Storybook dev server on http://localhost:6006 |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all source files |
| `npm run format:check` | Prettier check (no write) |

## Usage

1. Install [IITC](https://iitc.app/) (browser extension or mobile)
2. Install a userscript manager (Tampermonkey, Greasemonkey, etc.)
3. Add `dist/iitc-nexus.user.js` as a userscript
4. Open [Intel Map](https://intel.ingress.com/) — the dashboard loads automatically

## Project Structure

```
src/
  main.js                    # Plugin entry point & IITC bootstrap
  components/
    dashboard-shell/         # Root grid container
    topbar/                  # Top bar (logo, agent info, theme toggle)
    panels/                  # Left / Right / Bottom panel wrappers
    portal-list/             # Portal list widget
    portal-detail/           # Selected portal detail view
    comm-widget/             # COMM chat feed
    bookmarks/               # Bookmarks widget
    toolbox/                 # Toolbox links
    top-agents/              # Top agents ranking
    septicycle/              # Cycle progress
    cell-stats/              # S2 cell MU stats
    crt-screen/              # Boot animation
  services/
    iitc-signals.js          # Preact signals (portals, agent, theme, etc.)
    iitc-api.js              # IITC API bridge
  hooks/
    use-iitc-hook.js         # Signal subscription hook
  utils/
    region-score.js          # Region score fetching & caching
    helpers.js               # Shared utilities
  styles/
    tokens.css               # CSS custom properties (RES + ENL themes)
    dashboard.css            # Global layout & widget styles
```
## Demo

https://github.com/user-attachments/assets/83114db7-7f9d-49fb-8fc2-8d5710e062e7


## License

[GPL-3.0](LICENSE)

## Author

**nounzor** — [Buy me a coffee](https://buymeacoffee.com/nounzor)
