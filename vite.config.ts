/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "node:child_process";

// Hash du commit buildé : affiché discrètement dans l'UI pour savoir si le déploiement est à jour.
const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();

export default defineConfig(({ mode }) => ({
  base: "/life-clicker/",
  plugins: [svelte()],
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
  },
  resolve: mode === "test" ? { conditions: ["browser"] } : {},
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
}));
