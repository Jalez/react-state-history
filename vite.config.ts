import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Removing the dts plugin as we'll rely on TypeScript's own declaration generation
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/StateHistory/index.tsx"),
      name: "ReactStateHistory",
      fileName: (format) => `react-state-history.${format}.js`,
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
});
