import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./", // relative: works on GitHub Pages subpath and inside Capacitor
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tangga Kata",
        short_name: "Tangga Kata",
        description: "Ubah kata awal menjadi kata tujuan, satu huruf per langkah.",
        lang: "id",
        theme_color: "#111111",
        background_color: "#fafafa",
        display: "standalone",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
