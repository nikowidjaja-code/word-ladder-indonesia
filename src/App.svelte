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
  <div class="page">
    <header>
      <span class="title">Tangga Kata</span>
      <span class="meta">{game.s.mode === "daily" ? `Harian #${game.s.seed}` : "Acak"} · {game.s.start.length} huruf</span>
    </header>

    <div class="ladder">
    <section class="anchor">
      <small>Dari</small>
      <div class="word">{game.s.start}</div>
    </section>

    <ol class="chain">
      {#each game.s.chain.slice(1) as w (w)}
        <li transition:slide={{ duration: 200 }} class:hit={w === game.s.target}>{w}</li>
      {/each}
    </ol>
    <section class="anchor">
      <div class="word target">{game.s.target}</div>
      <small>Ke</small>
    </section>
    </div>

    <div class="play">
    <form onsubmit={onSubmit} autocomplete="off" class="box">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        bind:this={inputEl}
        bind:value={input}
        class:shake
        type="text"
        maxlength={game.s.start.length}
        disabled={game.s.done}
        placeholder={game.s.done ? "✓" : "·".repeat(game.s.start.length)}
        inputmode="text"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="go"
        aria-label="Kata berikutnya"
        autofocus
      />
      <p class="msg" role="alert">{msg}</p>
    </form>


    {#if game.s.done}
      <div class="done" transition:slide>
        {game.steps} langkah · par {game.s.par} · {over === 0 ? "sempurna!" : `+${over}`}
        {#if game.s.hints}· {game.s.hints} petunjuk{/if}
        {#if game.s.mode === "daily"}· streak {game.stats.streak}{/if}
        <button type="button" onclick={share}>{shared ? "Tersalin!" : "Bagikan"}</button>
      </div>
    {/if}

    </div>

    <footer>
      <div class="stats">
        <span><b>{game.steps}</b> langkah</span>
        <span>par <b>{game.s.par}</b></span>
        <span>terbaik <b>{game.stats.best[game.s.start.length] != null ? `+${game.stats.best[game.s.start.length]}` : "–"}</b></span>
      </div>
      <div class="actions">
        <button type="button" onclick={() => game.undo()} disabled={game.s.done || game.s.chain.length < 2}>Batal</button>
        <button type="button" onclick={() => game.hint()} disabled={game.s.done}>Petunjuk +1</button>
        <button type="button" onclick={() => !game.isTodayDaily && game.newGame("daily")}>Harian</button>
        <button type="button" onclick={() => { game.newGame("random"); shared = false; }}>Acak</button>
      </div>
      <a href="./privacy.html">Privasi</a>
    </footer>
  </div>
{/if}

<style>
  .page { min-height: 100dvh; display: flex; flex-direction: column; gap: 4px; }
  header { display: flex; justify-content: space-between; font-size: .8em; color: var(--mute); padding-bottom: 8px; }
  .title { font-weight: 600; letter-spacing: .05em; color: var(--fg); }

  .anchor { text-align: center; }
  .anchor small { display: block; font-size: .7em; text-transform: uppercase; letter-spacing: .2em; color: var(--mute); }
  .word { font-size: 2.2em; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; line-height: 1.2; }
  .word.target { color: var(--ok); }

  .chain { list-style: none; padding: 0; margin: 0; flex: 1; display: flex; flex-direction: column; justify-content: flex-end; overflow-y: auto; }
  .chain li { text-align: center; padding: 2px; font-size: 1.1em; letter-spacing: .25em; text-transform: uppercase; color: var(--mute); }
  .chain li.hit { color: var(--ok); }

  .box { margin: 12px 0; }
  input { display: block; width: 100%; font-size: clamp(2.4em, 12vw, 3.4em); font-weight: 700; letter-spacing: .25em; text-transform: uppercase; text-align: center; padding: .35em 0; border: 3px solid var(--fg); border-radius: 16px; background: transparent; color: var(--fg); }
  input::placeholder { color: var(--line); }
  input:focus { outline: none; box-shadow: 0 0 0 4px color-mix(in srgb, var(--fg) 15%, transparent); }
  input:disabled { border-color: var(--ok); color: var(--ok); }
  input.shake { animation: shake .3s; border-color: var(--bad); }
  @keyframes shake { 0%,100% { transform: none } 25% { transform: translateX(-10px) } 75% { transform: translateX(10px) } }
  .msg { min-height: 1.3em; margin: 6px 0 0; text-align: center; color: var(--bad); font-size: .9em; }

  .done { text-align: center; margin-top: 12px; padding: 10px; border: 1px solid var(--ok); border-radius: 12px; font-size: .95em; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 8px; align-items: center; }

  footer { margin-top: auto; padding-top: 16px; text-align: center; font-size: .85em; color: var(--mute); }
  .stats { display: flex; justify-content: center; gap: 16px; margin-bottom: 8px; }
  .stats b { color: var(--fg); }
  .actions { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; font-size: .85em; padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--fg); cursor: pointer; }
  button:disabled { opacity: .35; cursor: default; }
  footer a { display: inline-block; margin-top: 12px; color: inherit; font-size: .8em; }

  /* portrait / narrow: wrappers vanish, plain stack */
  .ladder, .play { display: contents; }

  /* landscape / wide: two columns, ladder left, box right */
  @media (min-width: 720px) and (orientation: landscape), (min-width: 900px) {
    .page { display: grid; grid-template-columns: minmax(200px, 1fr) minmax(0, 1.6fr); grid-template-rows: auto 1fr auto; grid-template-areas: "header header" "ladder play" "footer footer"; column-gap: clamp(24px, 5vw, 80px); }
    header { grid-area: header; }
    footer { grid-area: footer; margin-top: 0; }
    .ladder { grid-area: ladder; display: flex; flex-direction: column; min-height: 0; }
    .play { grid-area: play; display: flex; flex-direction: column; justify-content: center; }
    .word { font-size: clamp(2.2em, 5vw, 4em); }
    input { font-size: clamp(3em, 9vw, 7em); padding: .3em 0; border-width: 4px; border-radius: 24px; }
    .chain li { font-size: 1.3em; }
    .done { font-size: 1.05em; }
    footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .stats { margin: 0; }
    footer a { margin: 0; }
  }
</style>
