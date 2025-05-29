import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Server configuration
  server: {
    host: "::", // Allows access from any IP
    port: 8085, // Server port
    proxy: {
      '/api': {
        target: 'http://localhost:9999', // API target
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(), // React plugin
    mode === 'development' && componentTagger(), // Conditional plugin for development mode
  ].filter(Boolean), // Filter out any false values
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias for src directory
    },
  },
}));