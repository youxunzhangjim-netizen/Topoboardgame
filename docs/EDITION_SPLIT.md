# Topoboard Edition Split

Topological Board Game now keeps one GitHub repository while producing separate build editions. This is an additive split: current source folders stay where they are, current game pages remain intact, and BoardSpec / Labs infrastructure can be adapted gradually.

## Editions

### web-lite

`web-lite` is the GitHub Pages website edition.

- Output: `dist-web`
- Build: `npm run build:web`
- Deployed by: `.github/workflows/pages.yml`
- Includes stable public games, Life World, and safe public Labs entry points.
- Hides research bridge pages, material database placeholders, experimental boards, and heavy Labs.
- Must not publish `node_modules`, `local-data`, training JSONL, Steam private files, or release staging folders.

### steam-stable

`steam-stable` is the Steam desktop app edition.

- Output: `dist-steam`
- Build: `npm run build:steam`
- Includes stable games, Life World, selected Labs, desktop save support, and Steam Cloud-friendly local save files.
- Does not require an external Python bridge or material database connection.
- Keeps research bridge placeholders out of the stable desktop artifact unless explicitly promoted later.

### research-dev

`research-dev` is the future research bridge and workbench edition.

- Output: `dist-research`
- Build: `npm run build:research`
- May show Research Board Builder placeholders, BoardSpec import/export, safe Lab tooling, and future bridge planning surfaces.
- Is not deployed to GitHub Pages.
- Does not add external Python tools, material databases, Gmsh, OVITO, ParaView, Materials Project, NOMAD, or OPTIMADE yet.

### debug-dev

`debug-dev` is reserved for internal development.

- Output: `dist-debug` when used manually.
- May expose debug or suspended features locally.
- Must never be used for GitHub Pages or normal Steam release packaging.

## Configuration Files

Edition definitions live under:

- `configs/editions/web-lite.json`
- `configs/editions/steam-stable.json`
- `configs/editions/research-dev.json`
- `configs/editions/debug-dev.json`

The shared helper is:

- `js/shared/EditionConfig.js`

This helper lets future pages ask whether a feature, Lab tier, route, or feature status should be visible in the current edition. It is intentionally lightweight and does not force a full UI migration.

## Build Separation

The source tree is still shared. Build scripts choose the edition and output folder:

```bash
npm run build:web
npm run build:steam
npm run build:research
```

`tools/build-website.mjs` accepts:

```bash
node tools/build-website.mjs --edition web-lite --outDir dist-web
```

The build copies existing source and built workspace outputs, then removes edition-hidden routes from the artifact. Source files are not deleted.

## GitHub Pages

GitHub Pages deploys only `dist-web`.

The workflow:

- installs dependencies with `npm ci`
- runs `npm run build:web`
- uploads `dist-web`

This prevents research-dev, Steam artifacts, `local-data`, training output, and private Steam files from being published.

## Version Metadata

`scripts/write-version.mjs` writes:

- `version.json`
- `js/shared/version.json`

Each file records package version, edition, target, build time, and Git commit information when available.

## Verification

`scripts/verify-web-dist.mjs` checks that `dist-web`:

- exists
- has `index.html`, `.nojekyll`, `edition.json`, and `version.json`
- is marked as `web-lite`
- does not contain hidden web-lite routes
- does not contain forbidden private or generated paths
- does not link hidden Labs routes from the Labs home page

## Current Rule

Do not move all folders yet. Do not rewrite games. Do not redesign the UI. Do not add external Python tools or material database connections in this split. The edition layer only separates visibility, build outputs, deployment, and future migration boundaries.
