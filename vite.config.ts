import { defineConfig } from "vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    cloudflare({}),
    // cjsInterop({
    //   dependencies: ["semver"],
    // }),
  ],
  build: {
    // Force the Cloudflare Plugin to build the client side (and its assets)
    // by setting rollupOptions.input:
    // https://github.com/cloudflare/workers-sdk/issues/8629#issuecomment-2755886400
    rollupOptions: {
      input: "./src/matcha.css",
      output: {
        assetFileNames: "[name][extname]",
      },
    },
  },
});
