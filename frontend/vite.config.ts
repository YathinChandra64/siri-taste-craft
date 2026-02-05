import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },

  server: {
    host: true,
    port: 8080,

    watch: {
      // ✅ FIXED: Disable aggressive polling that causes refresh loops
      // Changed from: usePolling: true, interval: 1500
      usePolling: false,  // Disable polling - use native file watchers instead
      // Removed interval - not needed when usePolling is false
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/.env",
        "**/.env.local"
      ]
    },

    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});