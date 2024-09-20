// @ts-check
import { defineConfig } from "astro/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: [nodePolyfills()],
  },
});
