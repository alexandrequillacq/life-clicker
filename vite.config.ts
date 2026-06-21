/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  base: "/life-clicker/",
  plugins: [svelte()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
