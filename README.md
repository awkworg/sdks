# awkw SDKs

Embed SDKs from [awkw](https://awkw.org), as an npm workspace. MIT licensed.

## Packages

| Package | Output | Purpose |
|---------|--------|---------|
| [`embed-core`](packages/embed-core/) | — | Shared abstract base class and transition logic; bundled into each SDK, not published |
| [`iiif-sdk`](packages/iiif-sdk/) | `@awkw/iiif-embed` on npm | Static image → OpenSeaDragon IIIF viewer |
| [`maps-sdk`](packages/maps-sdk/) | `maps.js`, not published | Static image → interactive MapLibre map; waits on a maps service |

## Getting started

```bash
npm install
```

## Commands

| Command | What it does |
|---------|-------------|
| `npm test` | Run all package test suites |
| `npm run build` | Build `maps.js` and `iiif.js` |
| `npm run dev:maps` | Watch-build maps-sdk |
| `npm run dev:iiif` | Watch-build iiif-sdk |
| `npm run build:maps` | Build maps-sdk only |
| `npm run build:iiif` | Build iiif-sdk only |

## How it works

Both SDKs share the same interaction pattern via `embed-core`:

1. The page loads with a static `<img>` — fast, no JS overhead.
2. On **hover/focus**, the SDK wraps the image in a positioned container and inserts a hidden `<iframe>` to start preloading.
3. On **click/Enter/Space**, the image blurs and scales while the iframe loads; once ready, the iframe fades in and the image is removed.

```
idle → hovering → loading → transitioning → interactive
```

State changes are broadcast as a custom event (`awkw-maps:statechange` / `awkw-iiif:statechange`) that bubbles to `document`.

## Local dev setup

Each SDK has a test harness in its `test/` directory. Serve the repository root with any static server alongside the appropriate dev backend:

```bash
# Terminal 1 — watch-build the SDK you're working on
npm run dev:maps   # or dev:iiif

# Terminal 2 — serve the repo root so /dist/ paths resolve
npx serve .
# then open http://localhost:3000/packages/maps-sdk/test/
# or       http://localhost:3000/packages/iiif-sdk/test/
```

## Adding a new embed type

1. Create `packages/<name>-sdk/` mirroring the structure of `maps-sdk/` or `iiif-sdk/`.
2. Add `"@awkw/embed-core": "*"` to its dependencies.
3. Extend `EmbedBase` and implement the five abstract members — see [embed-core docs](packages/embed-core/README.md).
4. Write an `index.ts` that finds your CSS class and instantiates the class.
5. The esbuild command is the same pattern; just change the output filename.

## Releasing

`@awkw/iiif-embed` is published by `.github/workflows/release.yml` when a tag `iiif-embed-v<version>` is pushed, after the checks pass. The tag must match the version in `packages/iiif-sdk/package.json`:

```bash
npm version patch -w @awkw/iiif-embed --no-git-tag-version   # or minor / major
git commit -am "Release @awkw/iiif-embed <version>"
git tag iiif-embed-v<version> && git push && git push --tags
```

It signs in to npm through trusted publishing, so no token is stored. npm only lets a package that exists trust a workflow, so the very first release is published by hand from a checkout, signed in to npm as a member of the `awkw` organization:

```bash
npm ci && npm publish -w @awkw/iiif-embed --provenance=false
```

Then on npmjs.com, under the package's **Settings → Trusted publishing**, add GitHub Actions with organization `awkworg`, repository `sdks`, and workflow `release.yml`. Later releases need only the tag.
