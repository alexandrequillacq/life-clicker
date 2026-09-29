<script lang="ts">
  // Chapitre 2 : écran provisoire, remplacé à la tâche 15 du plan.
  import { game } from "./store.svelte";
  import { QUOTES } from "../engine/content/freelance";
  const s = $derived(game.state);
</script>

<main class="freelance">
  <p class="quote">{QUOTES[s.freelance.quote]}</p>
</main>
