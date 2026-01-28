import { defineConfig, UserConfig } from "vite";

export default defineConfig(({ mode }) => {
  const config: UserConfig = {
    build: {
      outDir: "build",
      rollupOptions: {
        output: {
          entryFileNames: "js/[name].js",
          chunkFileNames: "js/chunks/[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  };

  if (mode === "background" || mode === "script") {
    const entryFile =
      mode === "background" ? "src/js/background.js" : "src/js/script.js";

    config.build = {
      outDir: "build",
      emptyOutDir: false,
      rollupOptions: {
        input: {
          [mode]: entryFile,
        },
        output: {
          entryFileNames: "js/[name].js",
          format: "iife",
          inlineDynamicImports: true,
        },
      },
    };
  } else {
    config.build = {
      outDir: "build",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          menu: "src/js/menu.js",
          options: "src/js/options.js",
          popup: "src/js/popup.js",
        },
        output: {
          entryFileNames: "js/[name].js",
          chunkFileNames: "js/chunks/[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    };
  }

  return config;
});
