import { defineConfig } from "vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    cloudflare(),
    cjsInterop({
      dependencies: ["semver"],
    }),
  ],
});
