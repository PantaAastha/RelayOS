import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/embed.tsx'),
            name: 'RelayOSWidget',
            fileName: 'relayos-widget',
            formats: ['iife'], // Single file that can be embedded via script tag
        },
        rollupOptions: {
            // Bundle everything into a single file
            output: {
                inlineDynamicImports: true,
            },
        },
        cssCodeSplit: false, // Include CSS in the JS bundle
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
});
