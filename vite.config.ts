import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/UndoRedo"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "src/UndoRedo/index.tsx"
      ),
      name: "UndoRedoTs",
      fileName: (format) => `undo-redo-ts.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "zustand"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          zustand: "zustand",
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
