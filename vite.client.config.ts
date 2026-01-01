import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Client bundle configuration
// This creates the JavaScript that runs in the browser for hydration
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/client",
    manifest: true, // Generates manifest.json for asset fingerprinting
    rollupOptions: {
      input: "src/entry-client.tsx",
      output: {
        // Use a predictable filename for simplicity in this demo
        // In production, you'd read the manifest to get the hashed filename
        entryFileNames: "assets/entry-client.js",
      },
    },
  },
})
