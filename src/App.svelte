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

    <div class="center">
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
    {#if !game.s.done}
    <form onsubmit={onSubmit} autocomplete="off" class="box" transition:slide={{ duration: 200 }}>
      <div class="wrap" class:shake>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        bind:this={inputEl}
        bind:value={input}
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
      <div class="cells" aria-hidden="true">
        {#each { length: game.s.start.length } as _, i}
          <span class:empty={!input[i]} class:active={i === input.length}>{input[i] ?? ""}</span>
        {/each}
      </div>
      </div>
      <p class="msg" role="alert">{msg}</p>
    </form>
    {/if}


    {#if game.s.done}
      <div class="done" transition:slide>
        <p>
          {game.steps} langkah · par {game.s.par} · <b class:over={over > 0} class:perfect={over === 0}>{over === 0 ? "sempurna!" : `+${over}`}</b>
          {#if game.s.hints}· {game.s.hints} petunjuk{/if}
          {#if game.s.mode === "daily"}· streak {game.stats.streak}{/if}
        </p>
        <button type="button" class="primary" onclick={() => { game.newGame("random"); shared = false; }}>Main lagi</button>
        <button type="button" onclick={share}>{shared ? "Tersalin!" : "Bagikan"}</button>
      </div>
    {/if}

    </div>
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
  .page { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .ladder { display: contents; }
  .play { display: contents; }
  .center { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  header { display: flex; justify-content: space-between; font-size: .8em; color: var(--mute); padding-bottom: 8px; }
  .title { font-weight: 600; letter-spacing: .05em; color: var(--fg); }

  .anchor { text-align: center; }
  .anchor small { display: block; font-size: .7em; text-transform: uppercase; letter-spacing: .2em; color: var(--mute); }
  .word { font-size: 2.2em; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; line-height: 1.2; }
  .word.target { color: var(--ok); }

  .chain { list-style: none; padding: 0; margin: 0; }
  .chain li { text-align: center; padding: 2px; font-size: 1.1em; letter-spacing: .25em; text-transform: uppercase; color: var(--mute); }
  .chain li.hit { color: var(--ok); }

  .box { margin: 12px 0; }
  .wrap { position: relative; background: var(--soft); border-radius: 16px; transition: background .15s; }
  .wrap:focus-within { background: var(--softer); }
  input { display: block; width: 100%; min-width: 0; font-size: clamp(2em, 10vw, 3em); font-weight: 700; letter-spacing: .25em; text-transform: uppercase; text-align: center; padding: .35em 0; border: 0; background: transparent; color: transparent; caret-color: transparent; }
  .cells { position: absolute; inset: 0; font-size: clamp(2em, 10vw, 3em); display: flex; justify-content: center; align-items: center; gap: .3em; pointer-events: none; font-weight: 700; text-transform: uppercase; }
  .cells span { width: 1.1ch; text-align: center; border-bottom: .1em solid var(--line); }
  .cells span.empty { border-bottom-color: var(--mute); }
  .wrap:focus-within .cells span.active { border-bottom-color: var(--fg); }
  input:focus { outline: none; }
  .wrap.shake { animation: shake .3s; }
  .wrap.shake .cells span.empty { border-bottom-color: var(--bad); }
  @keyframes shake { 0%,100% { transform: none } 25% { transform: translateX(-10px) } 75% { transform: translateX(10px) } }
  .msg { min-height: 1.3em; margin: 6px 0 0; text-align: center; color: var(--bad); font-size: .9em; }

  .done { text-align: center; margin-top: 12px; padding: 10px; border: 1px solid var(--ok); border-radius: 12px;  font-size: .95em; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 8px; align-items: center; }

  footer { margin-top: auto; padding-top: 20px; text-align: center; font-size: .85em; color: var(--mute); }
  .stats { display: flex; justify-content: center; gap: 16px; margin-bottom: 8px; }
  .stats b { color: var(--fg); }
  .actions { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
  button { font: inherit; font-size: .85em; padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--fg); cursor: pointer; }
  button:disabled { opacity: .35; cursor: default; }
  footer a { display: inline-block; margin-top: 12px; color: inherit; font-size: .8em; }

  /* portrait / narrow: wrappers vanish, plain stack */

  /* landscape / wide: ladder left, box right */
  @media (min-width: 720px) and (orientation: landscape), (min-width: 900px) {
    .page { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr auto; grid-template-areas: "header header" "ladder play" "footer footer"; column-gap: 40px; align-items: center; }
    header { grid-area: header; }
    .center { display: contents; }
    footer { grid-area: footer; margin-top: 0; }
    .ladder { grid-area: ladder; display: flex; flex-direction: column; justify-content: center; min-width: 0; container-type: inline-size; }
    .chain { flex: 0 0 auto; max-height: 40vh; overflow-y: auto; }
    .play { grid-area: play; display: flex; flex-direction: column; justify-content: center; min-width: 0; container-type: inline-size; }
    .word { font-size: clamp(1.4em, 13cqw, 2.8em); }
    input, .cells { font-size: clamp(1.6em, 16cqw, 3.4em); }
    .box { margin: 0; }
  }
</style>
