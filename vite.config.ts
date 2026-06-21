/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => ({
  base: "/life-clicker/",
  plugins: [svelte()],
  resolve: mode === "test" ? { conditions: ["browser"] } : {},
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
}));
