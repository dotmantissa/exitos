import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          chain: ["viem"],
          validation: ["zod"],
        },
      },
    },
  },
  server: {
    strictPort: true,
    port: 5175,
    fs: {
      strict: true,
      allow: ["."],
      deny: [
        "**/.git/**",
        "**/.local/**",
        "**/.env*",
        "**/TASKS.md",
        "**/[Aa][Gg][Ee][Nn][Tt]*.md",
        "**/research-cache/**",
      ],
    },
  },
});
