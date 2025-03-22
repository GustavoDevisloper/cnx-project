import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/layouts": path.resolve(__dirname, "./src/layouts"),
      "@/contexts": path.resolve(__dirname, "./src/contexts")
    },
  },
}));
