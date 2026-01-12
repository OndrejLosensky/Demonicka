import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@demonicka/shared-types": path.resolve(__dirname, "../../packages/shared-types/src"),
      "@demonicka/shared-utils": path.resolve(__dirname, "../../packages/shared-utils/src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
});