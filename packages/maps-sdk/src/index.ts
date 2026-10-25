import { init } from './module';

/*
 * The script-tag build (dist/maps.js): it sets itself up when the page is ready. A tag can name
 * the maps service, `<script src=".../maps.js" data-maps-base="...">`; without it, each map uses
 * the service its image came from. A site that bundles the SDK imports `init` from the package
 * instead (src/module.ts).
 */
const script = document.currentScript as HTMLScriptElement | null;
const mapsBase = script?.dataset.mapsBase;
const options = mapsBase ? { mapsBase } : {};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(options));
} else {
    init(options);
}
