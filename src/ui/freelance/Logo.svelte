<script lang="ts">
  // Les 5 logos de la micro-entreprise, au trait, dans la couleur du texte (currentColor).
  let { logo, initial = "A", size = 24 }: { logo: number; initial?: string; size?: number } = $props();
</script>

<svg
  class="logo"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if logo === 0}
    <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
  {:else if logo === 1}
    <path d="M9 4c-2 0-3 1-3 3v2c0 1.5-1 3-2 3 1 0 2 1.5 2 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.5 1 3 2 3-1 0-2 1.5-2 3v2c0 2-1 3-3 3" />
  {:else if logo === 2}
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 10l3 2-3 2M12 15h5" />
  {:else if logo === 3}
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
    <circle cx="6" cy="6.5" r="0.4" />
    <circle cx="8.5" cy="6.5" r="0.4" />
  {:else}
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" stroke="none">{initial}</text>
  {/if}
</svg>
