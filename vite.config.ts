import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// For GitHub Pages deployment under /Lifejourney/
export default defineConfig({
  base: "/Lifejourney/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
