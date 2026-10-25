import { init } from './module';

/*
 * The script-tag build (dist/maps.js): it sets itself up when the page is ready, reading the
 * maps service from its own tag, `<script src=".../maps.js" data-maps-base="...">`, or using
 * maps.awkw.org. A site that bundles the SDK imports `init` from the package instead
 * (src/module.ts).
 */
const script = document.currentScript as HTMLScriptElement | null;
const options = { mapsBase: script?.dataset.mapsBase };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(options));
} else {
    init(options);
}
