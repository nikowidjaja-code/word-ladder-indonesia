// Smoke test: runs app.js under a tiny DOM stub. `node scripts/test.mjs`
import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const el = () => ({ textContent: "", value: "", hidden: false, disabled: false, maxLength: 0, innerHTML: "", className: "", classList: { add() {}, remove() {} }, focus() {}, appendChild() {}, remove() {}, lastElementChild: { remove() {} }, offsetWidth: 0 });
const els = {};
Object.assign(globalThis, {
  window: globalThis, location: { origin: "", pathname: "/" },
  document: { getElementById: (id) => (els[id] ??= el()), createElement: el },
  localStorage: { _: {}, getItem(k) { return this._[k] ?? null; }, setItem(k, v) { this._[k] = v; } },
  setTimeout() {},
});
vm.runInThisContext(readFileSync("data/words.js", "utf8"));
vm.runInThisContext(readFileSync("app.js", "utf8"));
const g = (code) => vm.runInThisContext(code);

// determinism + par range
const a = g("makePuzzle(42)"), b = g("makePuzzle(42)");
assert.deepEqual(a, b);
for (let s = 1; s <= 50; s++) { const p = g(`makePuzzle(${s})`); assert.ok(p.par >= 3 && p.par <= 6, `par ${p.par}`); assert.equal(g(`bfs(${JSON.stringify(p.start)}).get(${JSON.stringify(p.target)})`), p.par); }

// boot = daily, then hints walk to target in exactly par steps
assert.equal(g("S.mode"), "daily");
const par = g("S.par");
while (!g("S.done")) g('$("hint").onclick()');
assert.equal(g("S.chain.length - 1"), par);
assert.equal(g("S.hints"), par);
assert.equal(g("stats.streak"), 1);

// random game: invalid inputs rejected, valid neighbor accepted, undo works
g('newGame("random")');
const cur = g("cur()");
els.input.value = "zzzzzzz"; g('$("form").onsubmit({preventDefault(){}})'); assert.equal(g("S.chain.length"), 1);
const nb = g(`neighbors(${JSON.stringify(cur)})[0]`);
els.input.value = nb; g('$("form").onsubmit({preventDefault(){}})'); assert.equal(g("S.chain.length"), 2);
g('$("undo").onclick()'); assert.equal(g("S.chain.length"), 1);
console.log("ok: puzzles deterministic, par correct, hints/undo/validation work");
