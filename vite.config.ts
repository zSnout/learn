import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import solid from "vite-plugin-solid"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    solid(),
    tsconfigPaths(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      devOptions: { enabled: true, type: "module" },
      registerType: "autoUpdate",
      manifest: {
        name: "zSnout Learn",
        short_name: "zSnout Learn",
        description: "A flashcard application designed to help with studying.",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/safari-pinned-tab.svg",
            sizes: "any",
            type: "image/svg",
            purpose: "monochrome",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      },
    }),
  ],
  worker: {
    format: "es",
    plugins() {
      return [tsconfigPaths()]
    },
  },
  optimizeDeps: {
    esbuildOptions: { target: "es2022" },
    exclude: ["@sqlite.org/sqlite-wasm", "pyodide"],
  },
  esbuild: { target: "es2022" },
  build: { target: "es2022" },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
})
