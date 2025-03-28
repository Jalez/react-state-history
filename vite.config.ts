import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/StateHistory"],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/StateHistory/index.tsx",
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
