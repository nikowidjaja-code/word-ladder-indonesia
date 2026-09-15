// Tangga Kata — word ladder. Vanilla JS, no deps. Dictionary in window.WORDS {len: [words]} (giant component per length).
const LENS = [3, 4, 5, 6];
const MIN_PAR = 3, MAX_PAR = 6;
const SETS = Object.fromEntries(LENS.map((n) => [n, new Set(WORDS[n])]));
const $ = (id) => document.getElementById(id);

// ---------- graph ----------
function neighbors(w) {
  const set = SETS[w.length], out = [];
  for (let i = 0; i < w.length; i++)
    for (let c = 97; c <= 122; c++) {
      const v = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
      if (v !== w && set.has(v)) out.push(v);
    }
  return out;
}
function bfs(from) { // dist map from `from` to every word in its component
  const dist = new Map([[from, 0]]);
  const q = [from];
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    for (const v of neighbors(u)) if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); q.push(v); }
  }
  return dist;
}
function oneLetterDiff(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d === 1;
}

// ---------- rng / puzzle ----------
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const localDayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const EPOCH = Date.UTC(2026, 8, 15); // puzzle #1 = 2026-09-15
const dailyNumber = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000) + 1; };

function makePuzzle(seed) {
  const rng = mulberry32(seed);
  for (let tries = 0; tries < 200; tries++) {
    const len = LENS[Math.floor(rng() * LENS.length)];
    const words = WORDS[len];
    const start = words[Math.floor(rng() * words.length)];
    const dist = bfs(start);
    const cands = [...dist].filter(([, d]) => d >= MIN_PAR && d <= MAX_PAR).map(([w]) => w).sort();
    if (!cands.length) continue;
    const target = cands[Math.floor(rng() * cands.length)];
    return { start, target, par: dist.get(target) };
  }
  throw new Error("no puzzle");
}

// ---------- state ----------
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let stats = load("tk.stats", { best: {}, streak: 0, lastDaily: null });
let S = load("tk.session", null);
let distToTarget; // BFS from target, for par check + hints

function newGame(mode) {
  const seed = mode === "daily" ? dailyNumber() : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const p = makePuzzle(seed);
  S = { mode, seed, ...p, chain: [p.start], hints: 0, done: false };
  save("tk.session", S);
  render(true);
}
const steps = () => S.chain.length - 1 + S.hints;
const cur = () => S.chain[S.chain.length - 1];

function render(full) {
  if (!distToTarget || distToTarget.get(S.target) !== 0 || !distToTarget.has(S.start)) distToTarget = bfs(S.target);
  $("steps").textContent = steps();
  $("par").textContent = S.par;
  $("best").textContent = stats.best[S.start.length] != null ? `+${stats.best[S.start.length]}` : "-";
  $("modeLabel").textContent = S.mode === "daily" ? `Harian #${S.seed}` : "Acak";
  $("lenLabel").textContent = `${S.start.length} huruf`;
  $("target").textContent = S.target;
  const ol = $("chain");
  if (full) { ol.innerHTML = ""; S.chain.forEach((w, i) => addLi(w, false)); }
  const inp = $("input");
  inp.maxLength = S.start.length;
  inp.disabled = S.done; inp.value = "";
  $("undo").disabled = S.done || S.chain.length < 2;
  $("hint").disabled = S.done;
  $("done").hidden = !S.done;
  if (S.done) {
    const over = steps() - S.par;
    $("result").textContent = `Selesai dalam ${steps()} langkah (par ${S.par}, ${over === 0 ? "sempurna!" : `+${over}`})` + (S.hints ? `\n${S.hints} petunjuk` : "") + (S.mode === "daily" ? `\nStreak: ${stats.streak} hari` : "");
  } else inp.focus();
}
function addLi(w, hint) { const li = document.createElement("li"); li.textContent = w; if (hint) li.className = "hint"; $("chain").appendChild(li); }
function warn(t) { $("msg").textContent = t; const i = $("input"); i.classList.remove("shake"); void i.offsetWidth; i.classList.add("shake"); setTimeout(() => ($("msg").textContent = ""), 1800); }

function submit(w, isHint) {
  S.chain.push(w);
  if (isHint) S.hints++;
  addLi(w, isHint);
  if (w === S.target) finish();
  save("tk.session", S);
  render(false);
}
function finish() {
  S.done = true;
  const n = S.start.length, over = steps() - S.par;
  if (stats.best[n] == null || over < stats.best[n]) stats.best[n] = over;
  if (S.mode === "daily") {
    const today = localDayKey(), y = new Date(); y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    if (stats.lastDaily !== today) { stats.streak = stats.lastDaily === yKey ? stats.streak + 1 : 1; stats.lastDaily = today; }
  }
  save("tk.stats", stats);
}

// ---------- events ----------
$("form").onsubmit = (e) => {
  e.preventDefault();
  if (S.done) return;
  const w = $("input").value.trim().toLowerCase();
  if (!w) return;
  if (w.length !== S.start.length) return warn(`Harus ${S.start.length} huruf`);
  if (!oneLetterDiff(cur(), w)) return warn("Ubah tepat satu huruf");
  if (!SETS[w.length].has(w)) return warn("Kata tidak ada di kamus");
  if (S.chain.includes(w)) return warn("Kata sudah dipakai");
  submit(w, false);
};
$("undo").onclick = () => { if (S.chain.length > 1 && !S.done) { S.chain.pop(); $("chain").lastElementChild.remove(); save("tk.session", S); render(false); } };
$("hint").onclick = () => {
  if (S.done) return;
  const d = distToTarget.get(cur());
  const next = neighbors(cur()).find((v) => distToTarget.get(v) === d - 1);
  if (next) submit(next, true);
};
$("daily").onclick = () => { if (S.mode === "daily" && S.seed === dailyNumber()) return render(true); newGame("daily"); };
$("random").onclick = () => newGame("random");
$("share").onclick = async () => {
  const over = steps() - S.par;
  const text = `Tangga Kata ${S.mode === "daily" ? `#${S.seed}` : "(acak)"} · ${S.start.length} huruf\n${S.start.toUpperCase()} → ${S.target.toUpperCase()}\n${steps()} langkah, par ${S.par} (${over === 0 ? "sempurna" : `+${over}`})\n${location.origin}${location.pathname}`;
  try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); $("share").textContent = "Tersalin!"; } } catch {}
};

// ---------- boot ----------
if (S && SETS[S.start?.length]?.has(S.start) && (S.mode !== "daily" || S.seed === dailyNumber())) render(true);
else newGame("daily");
