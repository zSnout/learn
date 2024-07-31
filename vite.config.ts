import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import solid from "vite-plugin-solid"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    solid(),
    tsconfigPaths(),
    VitePWA({
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      manifest: false,
      injectManifest: { injectionPoint: undefined },
      devOptions: {
        enabled: true,
        type: "module",
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
