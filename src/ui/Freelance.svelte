<script lang="ts">
  // Acte I, chapitre 2 : le développeur freelance. La page part de celle du plongeur (blanche, deux colonnes)
  // et s'enrichit par paliers que le moteur décide : couleur, étiquettes, ombre, verre, puis le menu.
  // Ce composant n'invente rien : chaque bloc, ses libellés et ses sous-titres viennent de engine/freelance/vue.ts
  // (null = bloc caché). Le nom de l'entreprise est un texte du joueur : toujours {…}, jamais {@html}.
  import { game } from "./store.svelte";
  import { TEXTES, LOGO_LABELS, COMPANY_DEFAULT_NAME } from "../engine/content/freelance";
  import {
    vuePaliers,
    vueMenu,
    vueMarque,
    vueEntete,
    vueCarnet,
    vueAmeliorations,
    vueClients,
    vueTopClients,
    vueSansToi,
    vueVie,
    vueRendezVous,
    vueSemaine,
    vueGagne,
    vueFinances,
    vueSortie,
    vueFin,
    vueSouvenirs,
    type Bouton,
  } from "../engine/freelance";
  import Logo from "./freelance/Logo.svelte";
  import DeuxPieces from "./freelance/DeuxPieces.svelte";

  const s = $derived(game.state);
  const p = $derived(vuePaliers(s));
  const menu = $derived(vueMenu(s));
  const marque = $derived(vueMarque(s));
  const entete = $derived(vueEntete(s));
  const carnet = $derived(vueCarnet(s));
  const amelio = $derived(vueAmeliorations(s));
  const clients = $derived(vueClients(s));
  const top = $derived(vueTopClients(s));
  const sansToi = $derived(vueSansToi(s));
  const vie = $derived(vueVie(s));
  const rdv = $derived(vueRendezVous(s));
  const semaine = $derived(vueSemaine(s));
  const gagne = $derived(vueGagne(s));
  const finances = $derived(vueFinances(s));
  const sortie = $derived(vueSortie(s));
  const fin = $derived(vueFin(s));

  let tab = $state(0); // 0 Tableau de bord, 1 Pro, 2 Perso, 3 Finances
  let companyName = $state(COMPANY_DEFAULT_NAME);
  let companyLogo = $state(0);
  const souvenirs = $derived(vueSouvenirs(s, menu && tab === 2 ? 8 : 5));
  const maxBar = $derived(gagne ? Math.max(1, ...gagne.bars.map((b) => b.livraisons + b.entretien)) : 1);
</script>

{#snippet achat(b: Bouton)}
  <button class="bt" disabled={b.disabled} onclick={b.act}>{b.label}</button>
  {#if b.price}<span class="price">{b.price}</span>{/if}
  {#each b.lines as l}<p class="sub">{l}</p>{/each}
{/snippet}

{#snippet enTete()}
  <header class="top">
    <p class="quote">{entete.quote}</p>
    <p class="money">{TEXTES.money(entete.money)}</p>
    {#if entete.monday}<p class="sub">{entete.monday}</p>{/if}
  </header>
{/snippet}

<!-- La tâche en cours et son bouton : en haut de chaque onglet. -->
{#snippet travail()}
  <section class="card now" aria-label={carnet.title}>
    <div class="work-head">
      <h2>{carnet.title}</h2>
      {#if carnet.count}<span class="count">{carnet.count}</span>{/if}
    </div>
    {#if carnet.invoice}
      {@const inv = carnet.invoice}
      <div class="invoice">
        <h3>{inv.title}</h3>
        {#each inv.lines as l}<p class="sub">{l}</p>{/each}
        <label class="field">
          <span>{inv.field}</span>
          <input type="text" maxlength={inv.maxLength} bind:value={companyName} />
        </label>
        <fieldset class="logos">
          <legend>{inv.logos}</legend>
          {#each Array.from({ length: inv.logoCount }, (_, i) => i) as i (i)}
            <label class="logo-pick" class:on={companyLogo === i}>
              <input type="radio" name="logo" value={i} aria-label={LOGO_LABELS[i]} bind:group={companyLogo} />
              <Logo logo={i} initial={companyName.trim().charAt(0).toUpperCase() || "A"} />
            </label>
          {/each}
        </fieldset>
        <button class="bt cta" onclick={() => inv.create(companyName, companyLogo)}>{inv.cta}</button>
      </div>
    {:else}
      <div class="task">
        <span class="tag {carnet.task.kind}">{carnet.task.title}</span>
        {#each carnet.task.lines as l}<p class="sub">{l}</p>{/each}
        {#if carnet.task.share !== null}
          <div class="meter"><i style="width: {Math.min(100, carnet.task.share * 100)}%"></i></div>
          <p class="sub">{carnet.task.progress}</p>
        {/if}
      </div>
      <button class="bt work cta" disabled={carnet.work.disabled} onclick={carnet.work.act}>{carnet.work.label}</button>
      {#each carnet.work.lines as l}<p class="sub">{l}</p>{/each}
    {/if}
  </section>
{/snippet}

{#snippet ensuite()}
  {#if carnet.next}
    <section class="card">
      <h3>{TEXTES.ensuite}</h3>
      <table class="table">
        <tbody>
          {#each carnet.next as r, i (i)}
            <tr class:dim={r.dim}>
              <td><span class="tag {r.tagKind}">{r.tag}</span></td>
              <td>{r.client}</td>
              <td>{r.detail}</td>
              <td class:loss={r.loss}>{r.money}</td>
            </tr>
          {/each}
          {#if carnet.more}<tr class="more"><td colspan="4">{carnet.more}</td></tr>{/if}
        </tbody>
      </table>
    </section>
  {/if}
{/snippet}

{#snippet blocSortie()}
  {#if sortie}
    <section class="exit">
      <div>
        <p class="t">{sortie.title}</p>
        {#each sortie.lines as l}<p>{l}</p>{/each}
      </div>
      <div class="buy">{@render achat(sortie.buy)}</div>
    </section>
  {/if}
  {#if fin}<p class="fin-line">{fin}</p>{/if}
{/snippet}

{#snippet blocAmelio()}
  {#if amelio}
    <section class="card">
      <h3>{amelio.title}</h3>
      {#if amelio.offer}<div class="buy">{@render achat(amelio.offer)}</div>{/if}
      {#each amelio.owned as o}<p class="sub">{o}</p>{/each}
    </section>
  {/if}
{/snippet}

{#snippet blocClients()}
  {#if clients}
    <section class="card">
      <h3>{clients.title}</h3>
      {#each clients.offers as o (o.label)}<div class="buy">{@render achat(o)}</div>{/each}
      {#if clients.list}
        <ul class="clients">
          {#each clients.list as c (c.id)}
            <li class:late={c.late}>
              <span class="face">{c.initials}</span>
              <span class="who"><b>{c.name}</b><span>{c.detail}</span></span>
              <span class="fee">{c.fee}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet blocSansToi()}
  {#if sansToi}
    <section class="card">
      <h3>{sansToi.title}</h3>
      <div class="auto">
        {#each sansToi.items as t (t.name)}
          <div class="tool">
            <b>{t.name}</b>
            <span class="state">{t.state}</span>
            {#if t.hint}<p class="sub">{t.hint}</p>{/if}
            {#if t.compromis}<div class="buy">{@render achat(t.compromis)}</div>{/if}
            {#if t.cost}<p class="cost">{t.cost}</p>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
{/snippet}

{#snippet blocGagne()}
  {#if gagne}
    <section class="card earn">
      <div>
        <h3>{gagne.title}</h3>
        <p class="big">{gagne.big}</p>
        {#if gagne.delta}<p class="sub delta">{gagne.delta}</p>{/if}
        <div class="bars" aria-hidden="true">
          {#each gagne.bars as b (b.label)}
            <div class="bar" class:cur={b.current}>
              <span class="up">
                <i class="mai" style="height: {(b.entretien / maxBar) * 100}%"></i>
                <i class="del" style="height: {(b.livraisons / maxBar) * 100}%"></i>
              </span>
              <span class="down"><i style="height: {Math.min(100, (b.charges / maxBar) * 100)}%"></i></span>
              <small>{b.label}</small>
            </div>
          {/each}
        </div>
        <p class="sub">{gagne.note}</p>
      </div>
      {#if top}
        <div>
          <h3>{top.title}</h3>
          <ul class="clients">
          {#each top.items as c (c.id)}
            <li class:late={c.late}>
              <span class="face">{c.initials}</span>
              <span class="who"><b>{c.name}</b><span>{c.detail}</span></span>
              <span class="fee">{c.fee}</span>
            </li>
          {/each}
          </ul>
        </div>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet blocVie()}
  <section class="card vie" aria-label={vie.title}>
    <h2>{vie.title}</h2>
    <p class="sub">{vie.age}</p>
    <p>{vie.energy}</p>
    <div class="gauge"><i style="width: {Math.min(100, vie.share * 100)}%"></i></div>
    {#if vie.rest}<p class="sub rest">{vie.rest}</p>{/if}
    {#if vie.logement}<p class="logement">{vie.logement}</p>{/if}
    {#if vie.home}
      <figure class="home">
        <DeuxPieces />
        <figcaption><b>{vie.home.caption}</b><span class="sub">{vie.home.line}</span></figcaption>
      </figure>
    {/if}
    {#if vie.homeOffer}<div class="buy">{@render achat(vie.homeOffer)}</div>{/if}
    {#if vie.meal}<div class="buy">{@render achat(vie.meal)}</div>{/if}
    {#if vie.delivery}<div class="buy">{@render achat(vie.delivery)}</div>{/if}
    {#if vie.ratios}
      <dl>
        {#each vie.ratios as [k, v] (k)}<dt>{k}</dt><dd>{v}</dd>{/each}
      </dl>
    {/if}
  </section>
{/snippet}

{#snippet blocRdv()}
  {#if rdv}
    <section class="card" class:night={rdv.title !== null}>
      {#if rdv.title}<h2>{rdv.title}</h2>{/if}
      <ul>
        {#each rdv.items as r (r.title)}
          <li>
            <p class="t">{r.title}</p>
            {#if r.when}<p class="d">{r.when}</p>{/if}
            {#each r.buttons as b (b.label)}<div class="buy">{@render achat(b)}</div>{/each}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet blocSemaine()}
  {#if semaine}
    <section class="card">
      <h3>{semaine.title}</h3>
      <p class="big-sm">{semaine.net}</p>
      {#each semaine.rows as [k, v] (k)}<p class="row"><span>{k}</span><span>{v}</span></p>{/each}
    </section>
  {/if}
{/snippet}

{#snippet blocSouvenirs()}
  {#if souvenirs}
    <section class="souv">
      <h3>{souvenirs.title}</h3>
      <ul>
        {#each souvenirs.items as m, i (i)}<li class:missed={m.missed}>{m.text}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet blocFinances()}
  {#if finances}
    <section class="card fin">
      <h2>{finances.title}</h2>
      <p class="row"><span>{TEXTES.account}</span><span>{finances.account}</span></p>
      <p class="row"><span>{TEXTES.livret}</span><span>{finances.livret}</span></p>
      <div class="btns">
        <div class="buy">{@render achat(finances.deposit)}</div>
        <div class="buy">{@render achat(finances.withdraw)}</div>
      </div>
      {#if finances.lastWeek}
        <div class="ledger">
          <h3>{finances.lastWeek.title}</h3>
          {#each finances.lastWeek.rows as r (r.label)}
            <p class="row {r.kind}"><span>{r.label}</span><span>{r.value}</span></p>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
{/snippet}

<main class="fl" class:couleur={p.couleur} class:etiquettes={p.etiquettes} class:ombre={p.ombre} class:verre={p.verre} class:menu={p.menu}>
  {#if menu}
    <div class="window">
      <aside class="side">
        {#if marque}
          <p class="brand"><i><Logo logo={marque.logo} initial={marque.initial} size={18} /></i><span>{marque.name}</span></p>
        {/if}
        <nav>
          {#each menu as label, i (label)}
            <button class="tab" class:on={tab === i} onclick={() => (tab = i)}>{label}</button>
          {/each}
        </nav>
      </aside>
      <div class="page">
        {@render enTete()}
        <div class="cols">
          <div class="col">
            {@render travail()}
            {#if tab === 0}
              {@render blocSortie()}
              {@render ensuite()}
              {@render blocGagne()}
              {@render blocSansToi()}
            {:else if tab === 1}
              {@render ensuite()}
              {@render blocAmelio()}
              {@render blocClients()}
              {@render blocSansToi()}
            {:else if tab === 2}
              {@render blocVie()}
              {@render blocSouvenirs()}
            {:else}
              {@render blocFinances()}
            {/if}
          </div>
          <div class="col">
            {#if tab === 0}
              {@render blocVie()}
              {@render blocRdv()}
            {:else if tab === 2}
              {@render blocRdv()}
            {:else if tab === 3}
              {@render blocSemaine()}
            {:else if tab === 1}
              {@render blocRdv()}
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else}
    {@render enTete()}
    <div class="cols">
      <section class="col travail" aria-label={TEXTES.colWork}>
        <h2>{TEXTES.colWork}</h2>
        {@render blocSortie()}
        {@render travail()}
        {@render ensuite()}
        {@render blocAmelio()}
        {@render blocClients()}
        {@render blocSansToi()}
      </section>
      <section class="col">
        {@render blocVie()}
        {@render blocRdv()}
        {@render blocSemaine()}
        {@render blocSouvenirs()}
      </section>
    </div>
  {/if}
</main>

<style>
  /* Sans palier : la page du plongeur. Papier blanc, texte noir, boutons carrés. */
  .fl {
    --ink: #262120;
    --soft: #6f6966;
    --faint: #a8a29e;
    --good: #4f8a68;
    --warn: #c0604a;
    --night: #1f1c1b;
    --card: transparent;
    --edge: #262120;
    --radius: 0;
    --shadow: none;
    --flow: #262120;
    min-height: 100vh;
    padding: 24px 16px 48px;
    color: var(--ink);
    background: #fff;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15px;
    line-height: 1.45;
    font-variant-numeric: tabular-nums;
  }
  p { margin: 0; }
  ul { margin: 0; padding: 0; list-style: none; }
  h2 { font-size: 18px; margin: 0 0 8px; }
  h3 { font-size: 15px; margin: 0 0 6px; }
  .sub { color: var(--soft); font-size: 13px; }
  .warn { color: var(--warn); }
  .top { max-width: 1180px; margin: 0 auto 20px; }
  .quote { font-style: italic; }
  .money { font-size: 22px; margin-top: 6px; }
  .cols { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 360px); gap: 24px; align-items: start; }
  .col { display: grid; gap: 16px; align-content: start; min-width: 0; }
  .card { background: var(--card); border: 1px solid var(--edge); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px; }
  .bt { font: inherit; color: var(--ink); background: #fff; border: 1px solid var(--ink); border-radius: var(--radius); padding: 6px 12px; cursor: pointer; }
  .bt:disabled { opacity: 0.45; cursor: default; }
  .bt:focus-visible, .tab:focus-visible, input:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .cta { font-weight: 600; margin-top: 10px; }
  .price { margin-left: 8px; color: var(--soft); font-size: 13px; }
  .buy { margin-top: 10px; }
  .work-head { display: flex; align-items: baseline; gap: 12px; }
  .count { margin-left: auto; color: var(--warn); font-size: 13px; font-weight: 600; }
  .task { margin-top: 6px; }
  .meter { height: 6px; background: rgba(38, 33, 32, 0.08); border-radius: var(--radius); overflow: hidden; margin: 8px 0 4px; }
  .meter i { display: block; height: 100%; background: var(--flow); }
  .tag { font-size: 13px; font-weight: 600; }
  .table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .table td { padding: 6px 8px 6px 0; border-top: 1px solid rgba(38, 33, 32, 0.12); vertical-align: middle; }
  .table td:last-child { text-align: right; white-space: nowrap; }
  .table .loss { color: var(--warn); }
  .table tr.dim td { color: var(--faint); }
  .table tr.more td { color: var(--soft); }
  .invoice .field { display: grid; gap: 4px; margin-top: 10px; }
  .invoice input[type="text"] { font: inherit; padding: 6px 8px; border: 1px solid var(--ink); border-radius: var(--radius); max-width: 320px; }
  .logos { border: 0; padding: 0; margin: 10px 0 0; display: flex; gap: 8px; flex-wrap: wrap; }
  .logos legend { font-size: 13px; color: var(--soft); margin-bottom: 4px; }
  .logo-pick { position: relative; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid rgba(38, 33, 32, 0.25); border-radius: var(--radius); cursor: pointer; }
  .logo-pick:has(input:focus-visible) { outline: 2px solid var(--ink); outline-offset: 2px; }
  .logo-pick.on { border-color: var(--ink); background: rgba(38, 33, 32, 0.06); }
  .logo-pick input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .clients li { display: flex; gap: 10px; align-items: center; padding: 6px 0; }
  .clients .who { min-width: 0; display: grid; }
  .clients .who span { color: var(--soft); font-size: 12.5px; }
  .clients .fee { margin-left: auto; font-size: 13px; white-space: nowrap; }
  .clients li.late .fee { color: var(--warn); }
  .face { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 11.5px; font-weight: 600; border: 1px solid var(--ink); flex: none; }
  .auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .tool { display: flex; flex-direction: column; gap: 3px; border: 1px solid rgba(38, 33, 32, 0.2); border-radius: var(--radius); padding: 10px 12px; }
  .tool .state::before { content: ""; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--good); margin-right: 6px; }
  .tool .cost { margin-top: auto; color: var(--soft); font-size: 12.5px; }
  .earn { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 300px); gap: 20px; }
  .big { font-size: 40px; line-height: 1.05; letter-spacing: -0.02em; }
  .big-sm { font-size: 24px; margin-bottom: 6px; }
  .delta { color: var(--good); }
  .bars { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; height: 160px; margin: 14px 0 8px; }
  .bar { display: grid; grid-template-rows: 70% 18% auto; justify-items: center; }
  .bar .up { width: 14px; display: flex; flex-direction: column-reverse; background: rgba(38, 33, 32, 0.05); }
  .bar .down { width: 14px; display: flex; }
  .bar .down i { display: block; width: 100%; background: #7d736f; }
  .bar .del { background: #262120; }
  .bar .mai { background: #8a8380; }
  .bar small { font-size: 11.5px; color: var(--faint); }
  .bar.cur small { color: var(--ink); font-weight: 600; }
  .gauge { height: 8px; background: rgba(38, 33, 32, 0.08); border-radius: var(--radius); overflow: hidden; margin: 6px 0; }
  .gauge i { display: block; height: 100%; background: var(--ink); }
  .rest { color: var(--good); }
  .logement { margin-top: 6px; }
  .home { margin: 10px 0 0; }
  .home :global(.home-img) { display: block; width: 100%; height: auto; border-radius: var(--radius); }
  .home figcaption { display: grid; margin-top: 6px; }
  dl { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; margin: 14px 0 0; font-size: 13.5px; }
  dt { color: var(--soft); }
  dd { margin: 0; font-weight: 600; text-align: right; }
  .t { font-weight: 600; }
  .d { color: var(--soft); font-size: 12.5px; }
  li + li { margin-top: 12px; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0; font-size: 13.5px; }
  .row.sub span:first-child { padding-left: 12px; }
  .row.out span:last-child { color: var(--warn); }
  .row.net { font-weight: 700; border-top: 1px solid rgba(38, 33, 32, 0.15); margin-top: 4px; padding-top: 6px; }
  .ledger { margin-top: 14px; }
  .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .souv { font-size: 15px; }
  .souv li { padding: 2px 0; }
  .souv li + li { margin-top: 0; }
  .souv li.missed { color: var(--faint); font-style: italic; }
  .exit { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; border: 2px solid var(--ink); padding: 16px 18px; border-radius: var(--radius); }
  .exit .t { font-size: 17px; }
  .fin-line { font-style: italic; }

  /* Le menu : une colonne latérale et la page de l'onglet. */
  .window { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 24px; }
  .side { display: grid; gap: 4px; align-content: start; }
  nav { display: grid; gap: 4px; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; margin-bottom: 20px; }
  .brand i { width: 30px; height: 30px; display: grid; place-items: center; font-style: normal; border: 1px solid var(--ink); border-radius: var(--radius); }
  .tab { font: inherit; text-align: left; color: var(--soft); background: none; border: 0; border-radius: var(--radius); padding: 9px 12px; cursor: pointer; }
  .tab.on { color: var(--ink); background: rgba(38, 33, 32, 0.06); font-weight: 600; }
  .page { min-width: 0; }
  .page .top { margin: 0 0 18px; }
  .page .cols { max-width: none; }

  /* Palier 1, la chambre : la couleur (le fond et « Ta vie »). */
  .fl.couleur { background: linear-gradient(160deg, #f6e3d5 0%, #efe4e6 55%, #e6e2e3 100%); }
  .fl.couleur .vie { background: rgba(255, 255, 255, 0.55); border-color: rgba(184, 133, 151, 0.5); }
  .fl.couleur .gauge i { background: linear-gradient(90deg, #7fb596, var(--good)); }
  .fl.couleur .meter i { background: linear-gradient(90deg, #f0a462, #b88597); }

  /* Palier 2, la licence d'éditeur : les étiquettes du carnet prennent leur couleur. */
  .fl.etiquettes .tag { padding: 2px 9px; border-radius: 99px; font-size: 12px; }
  .fl.etiquettes .tag.order { background: rgba(238, 155, 88, 0.16); color: #b06a30; }
  .fl.etiquettes .tag.bug { background: rgba(192, 96, 74, 0.12); color: var(--warn); }
  .fl.etiquettes .tag.red { background: rgba(31, 28, 27, 0.08); }

  /* Palier 3, le T1 : l'ombre portée, les coins et la police définitive. */
  .fl.ombre {
    --radius: 14px;
    --edge: rgba(38, 33, 32, 0.08);
    --card: #fff;
    --shadow: 0 10px 30px rgba(90, 60, 50, 0.09);
    font-family: "Hanken Grotesk", system-ui, sans-serif;
    font-size: 14px;
  }
  .fl.ombre .bt { border-color: rgba(38, 33, 32, 0.2); }
  .fl.ombre .cta { background: var(--night); color: #fff; border: 0; padding: 12px 20px; box-shadow: 0 10px 22px rgba(31, 28, 27, 0.25); }
  .fl.ombre .souv { font-family: "Instrument Serif", Georgia, serif; font-size: 17px; }
  .fl.ombre .exit { border: 0; color: #fff; background: linear-gradient(120deg, #e9955a, #b27f93); box-shadow: 0 18px 36px rgba(178, 127, 147, 0.35); }
  .fl.ombre .exit .bt { background: #fff; color: var(--night); border: 0; font-weight: 700; }
  .fl.ombre .exit .sub { color: rgba(255, 255, 255, 0.85); }
  .fl.ombre .night { background: var(--night); color: #f2ece8; border: 0; }
  .fl.ombre .night .d, .fl.ombre .night .sub { color: rgba(242, 236, 232, 0.6); }

  /* Palier 4, le deux-pièces : le verre dépoli. */
  .fl.verre {
    --radius: 22px;
    --card: rgba(255, 255, 255, 0.46);
    --edge: rgba(255, 255, 255, 0.75);
    --shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 10px 30px rgba(90, 60, 50, 0.07);
    background:
      radial-gradient(900px 700px at 8% 12%, #f3c3a2 0%, transparent 60%),
      radial-gradient(700px 600px at 92% 88%, #e9b7a0 0%, transparent 55%),
      radial-gradient(800px 700px at 70% 0%, #d6d2d6 0%, transparent 60%),
      #cfc9c8;
  }
  .fl.verre .card { backdrop-filter: blur(24px) saturate(1.2); }
  .fl.verre .bar .del { background: linear-gradient(180deg, #f3b173, #ee9b58); }
  .fl.verre .bar .mai { background: linear-gradient(180deg, #caa0ae, #b88597); }
  .fl.verre .night { background: radial-gradient(420px 260px at 85% -10%, rgba(238, 155, 88, 0.55), transparent 65%), var(--night); }

  @media (max-width: 900px) {
    .cols, .window, .earn, .exit { grid-template-columns: 1fr; }
    .side { grid-auto-flow: column; overflow-x: auto; }
    nav { display: flex; gap: 4px; }
    .brand { margin-bottom: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .meter i, .gauge i { transition: none; }
  }
</style>
