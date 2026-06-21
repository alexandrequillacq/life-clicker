import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// style: false → on désactive le hook CSS de Vite (utile seulement pour SCSS/PostCSS,
// qu'on n'utilise pas). Le scoping CSS reste géré par le compilateur Svelte.
// Cela évite un crash de vitePreprocess sous Vitest (Vite 6 + preprocessCSS).
export default { preprocess: vitePreprocess({ style: false }) };
