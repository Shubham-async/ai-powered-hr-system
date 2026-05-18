import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    allowedHosts: [
      'aurion-ung6.onrender.com' 
    ],
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    // Only include the tagger in true development mode
    mode === "development" ? componentTagger() : null
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // This helps resolve issues with commonjs dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));