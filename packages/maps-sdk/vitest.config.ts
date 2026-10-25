import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        /* Tests check the iframe's src; happy-dom would otherwise fetch it
           from the network. It still prints that it didn't. */
        environmentOptions: {
            happyDOM: { settings: { disableIframePageLoading: true } },
        },
    },
});
