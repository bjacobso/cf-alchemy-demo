import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Server bundle configuration for Cloudflare Workers SSR
// This creates the SSR render function that runs in the Worker
export default defineConfig({
  plugins: [react()],
  build: {
    ssr: true,
    outDir: "dist/server",
    target: "esnext", // Use esnext for modern JS - Workers support it
    rollupOptions: {
      input: "src/entry-server.tsx",
      output: {
        format: "esm", // Workers use ES modules
      },
    },
  },
  ssr: {
    target: "webworker", // Tell Vite this is for webworker environment (not Node)
    noExternal: true, // Bundle everything - Workers can't resolve node_modules at runtime
  },
})
