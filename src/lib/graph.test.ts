import { test } from "node:test";
import assert from "node:assert/strict";
import { bfs, neighbors, oneLetterDiff, isWord, LENS, WORDS, COMMON } from "./graph.ts";
import { makePuzzle, MIN_PAR, MAX_PAR, dailyNumber } from "./puzzle.ts";

test("dictionary: every word has a neighbor (giant component)", () => {
  for (const n of LENS) for (const w of WORDS[n]) assert.ok(neighbors(w).length > 0, w);
});

test("puzzles deterministic, par within range and equals BFS distance", () => {
  assert.deepEqual(makePuzzle(42), makePuzzle(42));
  for (let s = 1; s <= 50; s++) {
    const p = makePuzzle(s);
    assert.ok(p.par >= MIN_PAR && p.par <= MAX_PAR, `seed ${s} par ${p.par}`);
    assert.equal(bfs(p.start).get(p.target), p.par);
    assert.ok(isWord(p.start) && isWord(p.target));
    assert.ok(COMMON[p.start.length as 3].includes(p.start) && COMMON[p.target.length as 3].includes(p.target));
  }
});

test("every common word has at least one common partner 3-6 steps away", () => {
  for (const n of LENS) for (const w of COMMON[n]) {
    const d = bfs(w);
    assert.ok(COMMON[n].some((v) => (d.get(v) ?? 0) >= MIN_PAR && d.get(v)! <= MAX_PAR), `${w} has no partner`);
  }
});

test("oneLetterDiff", () => {
  assert.ok(oneLetterDiff("kata", "kota"));
  assert.ok(!oneLetterDiff("kata", "kata"));
  assert.ok(!oneLetterDiff("kata", "koti"));
  assert.ok(!oneLetterDiff("kata", "katak"));
});

test("dailyNumber starts at 1 on 2026-09-15", () => {
  assert.equal(dailyNumber(new Date(2026, 8, 15)), 1);
  assert.equal(dailyNumber(new Date(2026, 8, 16)), 2);
});
