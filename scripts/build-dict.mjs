// Usage: node scripts/build-dict.mjs [data/source.lst]
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2] ?? "data/source.lst";
const blocklist = new Set(
  (() => { try { return readFileSync("data/blocklist.txt", "utf8").split(/\s+/); } catch { return []; } })()
);
const all = new Set(
  readFileSync(src, "utf8").split(/\r?\n/).map((w) => w.trim().toLowerCase()).filter((w) => /^[a-z]{3,6}$/.test(w) && !blocklist.has(w))
);

// ponytail: crude affix check, not a real stemmer. Drop word if stripping a common affix yields another listed word.
const PRE = ["me", "di", "ter", "ber", "pe", "se", "ke"];
const SUF = ["kan", "an", "i", "nya"];
function isDerived(w) {
  for (const p of PRE) if (w.startsWith(p) && all.has(w.slice(p.length))) return true;
  for (const s of SUF) if (w.endsWith(s) && all.has(w.slice(0, -s.length))) return true;
  return false;
}
const roots = [...all].filter((w) => !isDerived(w));

function neighbors(w, set) {
  const out = [];
  for (let i = 0; i < w.length; i++)
    for (let c = 97; c <= 122; c++) {
      const ch = String.fromCharCode(c);
      if (ch === w[i]) continue;
      const v = w.slice(0, i) + ch + w.slice(i + 1);
      if (set.has(v)) out.push(v);
    }
  return out;
}

function giantComponent(words) {
  const set = new Set(words);
  const seen = new Set();
  let best = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    const comp = [];
    const q = [w];
    seen.add(w);
    while (q.length) {
      const u = q.pop();
      comp.push(u);
      for (const v of neighbors(u, set)) if (!seen.has(v)) { seen.add(v); q.push(v); }
    }
    if (comp.length > best.length) best = comp;
  }
  return best.sort();
}

// common anchors: intersection with top-N of OpenSubtitles 2018 frequency list (hermitdave/FrequencyWords)
const TOP_N = 5000;
const MIN_PAR = 3, MAX_PAR = 6; // keep in sync with src/lib/puzzle.ts
const top = new Set(readFileSync("data/freq-id.txt", "utf8").split("\n").slice(0, TOP_N).map((l) => l.split(" ")[0]));

const out = { words: {}, common: {} };
for (const n of [3, 4, 5, 6]) {
  const words = roots.filter((w) => w.length === n);
  const gc = giantComponent(words);
  out.words[n] = gc;
  // anchors: common words that have at least one common partner MIN_PAR..MAX_PAR steps away
  const set = new Set(gc), common = gc.filter((w) => top.has(w)), cset = new Set(common);
  out.common[n] = common.filter((w) => {
    const dist = new Map([[w, 0]]), q = [w];
    for (let i = 0; i < q.length; i++) for (const v of neighbors(q[i], set)) if (!dist.has(v)) { dist.set(v, dist.get(q[i]) + 1); q.push(v); }
    return [...dist].some(([v, d]) => cset.has(v) && d >= MIN_PAR && d <= MAX_PAR);
  });
  console.log(`len ${n}: ${words.length} words -> giant component ${gc.length}, common anchors ${out.common[n].length}`);
}

writeFileSync("data/words.json", JSON.stringify(out));
console.log("wrote data/words.json");
