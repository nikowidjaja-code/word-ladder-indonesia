<script lang="ts">
  import { onMount, tick } from "svelte";
  import { slide } from "svelte/transition";
  import { Share } from "@capacitor/share";
  import { game } from "./lib/game.svelte";

  let input = $state("");
  let msg = $state("");
  let shake = $state(false);
  let shared = $state(false);
  let inputEl: HTMLInputElement | undefined = $state();
  let msgTimer: ReturnType<typeof setTimeout>;

  onMount(() => game.init());

  function warn(t: string) {
    msg = t; shake = false;
    requestAnimationFrame(() => (shake = true));
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => (msg = ""), 1800);
  }
  async function onSubmit(e: Event) {
    e.preventDefault();
    const err = game.submit(input);
    if (err) return warn(err);
    input = "";
    await tick(); inputEl?.focus();
  }
  async function share() {
    const text = game.shareText(location.origin + location.pathname);
    try {
      if ((await Share.canShare()).value) await Share.share({ text });
      else { await navigator.clipboard.writeText(text); shared = true; }
    } catch {}
  }
  const over = $derived(game.ready ? game.steps - game.s.par : 0);
</script>

{#if game.ready}
  <header>
    <h1>Tangga Kata</h1>
    <div class="stats">
      <div><span>{game.steps}</span><small>Langkah</small></div>
      <div><span>{game.s.par}</span><small>Par</small></div>
      <div><span>{game.stats.best[game.s.start.length] != null ? `+${game.stats.best[game.s.start.length]}` : "-"}</span><small>Terbaik</small></div>
    </div>
  </header>

  <main>
    <p class="mode">{game.s.mode === "daily" ? `Harian #${game.s.seed}` : "Acak"} · {game.s.start.length} huruf</p>

    <ol>
      {#each game.s.chain as w, i (w)}
        <li transition:slide={{ duration: 200 }} class:first={i === 0}>{w}</li>
      {/each}
    </ol>

    <form onsubmit={onSubmit} autocomplete="off">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        bind:this={inputEl}
        bind:value={input}
        class:shake
        type="text"
        maxlength={game.s.start.length}
        disabled={game.s.done}
        inputmode="text"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="go"
        aria-label="Kata berikutnya"
        autofocus
      />
    </form>
    <p class="msg" role="alert">{msg}</p>
    <p class="target">Tujuan: <b>{game.s.target}</b></p>

    <div class="actions">
      <button type="button" onclick={() => game.undo()} disabled={game.s.done || game.s.chain.length < 2}>Batal</button>
      <button type="button" onclick={() => game.hint()} disabled={game.s.done}>Petunjuk (+1)</button>
    </div>

    {#if game.s.done}
      <div class="done" transition:slide>
        <p>
          Selesai dalam {game.steps} langkah (par {game.s.par}, {over === 0 ? "sempurna!" : `+${over}`})
          {#if game.s.hints}<br />{game.s.hints} petunjuk{/if}
          {#if game.s.mode === "daily"}<br />Streak: {game.stats.streak} hari{/if}
        </p>
        <button type="button" onclick={share}>{shared ? "Tersalin!" : "Bagikan"}</button>
      </div>
    {/if}

    <div class="actions nav">
      <button type="button" onclick={() => !game.isTodayDaily && game.newGame("daily")}>Harian</button>
      <button type="button" onclick={() => { game.newGame("random"); shared = false; }}>Acak</button>
    </div>
  </main>

  <footer><a href="./privacy.html">Privasi</a> · Kata dari daftar Ivan Lanin (2011)</footer>
{/if}

<style>
  header { text-align: center; }
  h1 { margin: 0 0 8px; font-weight: 600; letter-spacing: .05em; }
  .stats { display: flex; justify-content: center; gap: 24px; }
  .stats div { display: flex; flex-direction: column; align-items: center; }
  .stats span { font-size: 1.4em; font-weight: 600; }
  .stats small { font-size: .75em; color: var(--mute); text-transform: uppercase; }
  .mode { text-align: center; color: var(--mute); font-size: .85em; margin: 12px 0 4px; }
  ol { list-style: none; padding: 0; margin: 0; }
  li { text-align: center; padding: 8px; font-size: 1.5em; letter-spacing: .3em; text-transform: uppercase; border-bottom: 1px solid var(--line); }
  li.first { color: var(--mute); }
  input { width: 100%; font-size: 1.5em; letter-spacing: .3em; text-transform: uppercase; text-align: center; padding: 10px; border: 2px solid var(--line); border-radius: 8px; background: transparent; color: var(--fg); margin-top: 8px; }
  input:focus { outline: none; border-color: var(--fg); }
  input.shake { animation: shake .3s; border-color: var(--bad); }
  @keyframes shake { 0%,100% { transform: none } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
  .msg { min-height: 1.4em; text-align: center; color: var(--bad); font-size: .9em; margin: 6px 0; }
  .target { text-align: center; margin: 4px 0 12px; }
  .target b { letter-spacing: .3em; text-transform: uppercase; font-size: 1.2em; }
  .actions { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
  .nav { margin-top: 24px; }
  button { font: inherit; padding: 8px 14px; border: 1px solid var(--line); border-radius: 8px; background: transparent; color: var(--fg); cursor: pointer; }
  button:disabled { opacity: .4; cursor: default; }
  .done { text-align: center; margin-top: 16px; padding: 12px; border: 1px solid var(--ok); border-radius: 8px; }
  .done p { margin: 0 0 8px; }
  footer { text-align: center; color: var(--mute); font-size: .75em; margin-top: 32px; }
  footer a { color: inherit; }
</style>
