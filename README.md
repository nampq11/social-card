# Social Card

[![CI](https://github.com/nampq11/social-card/actions/workflows/ci.yml/badge.svg)](https://github.com/nampq11/social-card/actions/workflows/ci.yml)

A minimalist card studio that renders share-ready images for Threads, X, and Facebook — straight from the browser.

**Live app:** <https://workboost.qzz.io/social-card>

## About

Social Card is a browser-based design studio for social-media images. You edit a live card — headline, screenshots, avatar, QR CTA — and export a pixel-perfect PNG sized for each platform. There is no account and no server-side processing: the whole studio runs client-side, and an export lands either on your clipboard (paste straight into Threads/X/Facebook) or as a PNG file.

The interface follows Apple's design language — a viewport-locked studio shell, translucent frosted-glass panels, tactile controls, and OS-following dark mode.

## Features

- **Two card types**
  - **Quote Card** — big typographic headline, sublines, optional QR CTA, and a signature footer with avatar.
  - **Showcase Card** — a hero-plus-details collage of up to three screenshot slots with handwritten annotations and a centered author footer.
- **Platform-ready ratios** — `1:1` Square (1800 × 1800 px), `4:5` Portrait (1600 × 2000 px), and `16:9` Landscape (2000 × 1125 px), exported at 2.5× Retina quality.
- **Themes & style presets** — Paper, White, and Dark themes, plus one-tap style presets (Classic, Midnight, Minimal, Billboard) that set ratio, theme, and typography in a single undoable step.
- **Card Export** — copy a Retina PNG directly to the clipboard or download it as a file.
- **Dynamic QR code CTA** — generate a QR code pointing at any GitHub / website / profile URL.
- **Screenshot grooming** — per-shot Fill/Fit modes, draggable Focus, 1–4× zoom, and fluid physics pan (rubber-banding, momentum, pinch and ctrl+wheel zoom).
- **Bilingual interface** — full Vietnamese and English UI with a runtime language toggle.
- **One-Screen Studio** — viewport-locked desktop shell (sidebar Inspector + Canvas); mobile switches to a bottom-sheet layout below 1024 px.
- **Quality-of-life** — undo/redo, first-run onboarding tour, welcome card, and OS-following dark mode.

## Tech Stack

| Layer   | Choice                                                           |
| ------- | ---------------------------------------------------------------- |
| UI      | React 19, TypeScript, Base UI (`@base-ui/react`)                 |
| Styling | Tailwind CSS v4 (semantic design-token vocabulary, see ADR 0007) |
| State   | Zustand (undoable card store)                                    |
| Export  | `html-to-image` (clipboard + PNG)                                |
| Other   | `qrcode.react`, Sonner toasts                                    |
| Tooling | Vite 8, Vitest + Testing Library, oxlint / oxfmt, Husky, pnpm 10 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+

### Install & run

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173> in your browser.

## Scripts

| Command                             | Description                                                                |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                          | Start the Vite dev server                                                  |
| `pnpm build`                        | Type-check (`tsc -b`) and build for production                             |
| `pnpm preview`                      | Preview the production build locally                                       |
| `pnpm test`                         | Run unit tests (Vitest)                                                    |
| `pnpm lint`                         | Lint with oxlint                                                           |
| `pnpm format` / `pnpm format:check` | Format / verify formatting with oxfmt                                      |
| `pnpm glossary`                     | Enforce GLOSSARY.md banned terms on `src/` identifiers                     |
| `pnpm smoke:*`                      | Headless-Chrome smoke checks (`export`, `pan`, `theme`, `tour`, `zoom`)    |
| `pnpm check`                        | Full quality gate: glossary + lint + format + tests + build (what CI runs) |

## Deployment

The project ships a `vercel.json` configured for a Vite SPA served under the `/social-card` base path.

- **Via GitHub (recommended):** import the repository at [vercel.com/new](https://vercel.com/new) and deploy.
- **Via Vercel CLI:**

  ```bash
  npx vercel --prod
  ```

## Project Structure

```text
src/
├── components/    # Studio UI — Header, Inspector, card previews, onboarding
│   └── ui/        # Shared primitives (Button, Select, Slider, Tooltip, …)
├── lib/           # Card store, export, i18n, shot fit/focus/zoom logic
├── constants/     # Ratio & size single source of truth
docs/
├── adr/           # Architecture Decision Records
scripts/           # Glossary gate + headless-Chrome smoke checks
public/            # Static assets (demo avatar, favicon)
```

## Documentation

- [GLOSSARY.md](GLOSSARY.md) — the project's domain vocabulary (terms the code and docs are held to)
- [docs/adr/](docs/adr/) — architecture decision records
- [CHANGELOG.md](CHANGELOG.md) — release history

## Contributing

This is a personal project. Bugs and ideas are tracked in [GitHub Issues](https://github.com/nampq11/social-card/issues). If you open a pull request, `pnpm check` must pass — CI runs the same gate.

## License

No open-source license has been declared yet; all rights are reserved by the author.
