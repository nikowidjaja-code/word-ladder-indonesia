import { LENS, WORDS, bfs } from "./graph.ts";

export const MIN_PAR = 3, MAX_PAR = 6;
export interface Puzzle { start: string; target: string; par: number }

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EPOCH = Date.UTC(2026, 8, 15); // daily #1 = 2026-09-15 (local date)
export function dailyNumber(d = new Date()): number {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000) + 1;
}
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Deterministic for a given seed + dictionary. Changing data/words.json changes daily puzzles. */
export function makePuzzle(seed: number): Puzzle {
  const rng = mulberry32(seed);
  for (let tries = 0; tries < 200; tries++) {
    const len = LENS[Math.floor(rng() * LENS.length)];
    const words = WORDS[len];
    const start = words[Math.floor(rng() * words.length)];
    const dist = bfs(start);
    const cands = [...dist].filter(([, d]) => d >= MIN_PAR && d <= MAX_PAR).map(([w]) => w).sort();
    if (!cands.length) continue;
    const target = cands[Math.floor(rng() * cands.length)];
    return { start, target, par: dist.get(target)! };
  }
  throw new Error("no puzzle for seed " + seed);
}
