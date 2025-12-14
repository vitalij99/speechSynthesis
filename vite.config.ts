import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "build",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: "src/js/background.js",
        script: "src/js/script.js",
        menu: "src/js/menu.js",
        options: "src/js/options.js",
        popup: "src/js/popup.js",
      },
      output: {
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
        manualChunks: undefined,
      },
    },
  },
});
