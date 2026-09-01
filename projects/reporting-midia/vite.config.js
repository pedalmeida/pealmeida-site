import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const APP_BASE = "/projects/reporting-midia/";

/** Copy index.html to known SPA routes so Cloudflare Workers static assets can serve them. */
function spaRouteCopies(routes) {
  return {
    name: "spa-route-copies",
    closeBundle() {
      const dist = path.resolve("dist");
      const indexPath = path.join(dist, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const html = fs.readFileSync(indexPath, "utf8");
      for (const route of routes) {
        const dir = path.join(dist, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html);
      }
    },
  };
}

export default defineConfig({
  base: APP_BASE,
  plugins: [react(), spaRouteCopies(["relatorio"])],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
