import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages deployment under /Lifejourney/
export default defineConfig({
  base: "/Lifejourney/", // Must match repo name exactly
  plugins: [react()],
  server: {
    port: 5173,
  },
});
