import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let plugins = [react()];
  
  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (e) {
      // lovable-tagger not available, skipping
    }
  }
  
  return {
    server: {
      host: "localhost",
      port: 5174,
      hmr: {
        overlay: false,
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
