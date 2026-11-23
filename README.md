# 📷 One Photo, Every Angle — Sohee An (soheean1370)

> *✿ what would this photo look like from where the camera never was? ✿*

A portfolio built around my research topic, **Novel View Synthesis** (making new viewpoints from a single photo).
One polaroid of an American high-school hallway scatters into points, turns, reveals the holes the camera never saw, fills them in, and becomes a 3D hallway you can walk through.

- Live: https://soheean1370.github.io/
- Flat (2D) version with every item: https://soheean1370.github.io/flat.html

## Status (2026-11-23)
| Step | What | State |
|---|---|---|
| M0 | Vite + GitHub Actions deploy | ✅ |
| M1 | Content JSON + flat version (all assignment items, resume, photo) | ✅ |
| M2 | Hallway + lockers | ⏳ tonight |
| M3 | Camera rail + scroll + view chips | ⏳ tonight |
| M4 | Photo → points → holes → fill | ⏳ tonight |
| M5 | HUD + panels + props | ⏳ tonight |

## Structure
```
index.html            3D version (flat content until M2 lands)
flat.html             2D version — every assignment item as plain HTML
public/               resume.pdf, photos/profile.webp, favicon, .nojekyll
src/content/*.json    all text lives here (profile, copy EN/KO, projects, research, toolkit, timeline)
src/content/render.js turns the JSON into HTML — used at build time (flat) and at runtime (3D panels)
src/ui/styles/        tokens.css (colors, fonts), flat.css
.github/workflows/    deploy.yml (build → GitHub Pages)
```
To edit text, change the JSON — both versions update. Fields set to `null` show up as `[확인 필요]` / "soon".

## Develop
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/
```
Deploy: push to `main`. Repo **Settings → Pages → Source = GitHub Actions**.

## AI usage
- **Me (Sohee):** concept, research content and survey categories, self-introduction copy, photo choice, final review.
- **Claude Code:** code (Vite setup, renderer, styles, 3D scene and shaders), first drafts of English copy, deploy workflow.
- Research-board pros/cons for groups A–C are drafts to be checked by me.

No code, copy, or design was copied from other portfolios. Fonts are OFL (Google Fonts, Pretendard).
