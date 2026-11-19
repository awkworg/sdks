import { DEFAULT_VIEWER_BASE, destroy, embedFor, init } from './module';

/*
 * The script-tag build (dist/iiif.js): it sets itself up when the page is ready, reading the
 * viewer's base from its own tag, `<script src=".../iiif.js" data-viewer-base="...">`. A site
 * that bundles the SDK imports `init` from the package instead (src/module.ts).
 */
const script = document.currentScript as HTMLScriptElement | null;
const viewerBase = script?.dataset.viewerBase ?? DEFAULT_VIEWER_BASE;

/* For pictures added after the page loaded, and to close or take away an embed: `AwkwIiif.init()`. */
(window as unknown as { AwkwIiif: unknown }).AwkwIiif = {
    init: (options: Parameters<typeof init>[0] = {}) => init({ viewerBase, ...options }),
    embedFor,
    destroy,
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init({ viewerBase }));
} else {
    init({ viewerBase });
}
