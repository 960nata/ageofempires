import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{rollupOptions:{input:[resolve('index.html'),resolve('animation-review.html')]}}});
