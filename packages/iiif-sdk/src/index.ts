import { DEFAULT_VIEWER_BASE, init } from './module';

/*
 * The script-tag build (dist/iiif.js): it sets itself up when the page is ready, reading the
 * viewer's base from its own tag, `<script src=".../iiif.js" data-viewer-base="...">`. A site
 * that bundles the SDK imports `init` from the package instead (src/module.ts).
 */
const script = document.currentScript as HTMLScriptElement | null;
const viewerBase = script?.dataset.viewerBase ?? DEFAULT_VIEWER_BASE;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init({ viewerBase }));
} else {
    init({ viewerBase });
}
