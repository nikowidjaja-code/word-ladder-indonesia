import data from "../../data/words.json" with { type: "json" };

export const LENS = [3, 4, 5, 6] as const;
export type Len = (typeof LENS)[number];
export const WORDS = data.words as Record<Len, string[]>;
/** Common words (top-5k subtitle frequency); start/target are drawn only from these. */
export const COMMON = data.common as Record<Len, string[]>;
const SETS: Record<number, Set<string>> = Object.fromEntries(LENS.map((n) => [n, new Set(WORDS[n])]));

export const isWord = (w: string) => SETS[w.length]?.has(w) ?? false;

export function neighbors(w: string): string[] {
  const set = SETS[w.length];
  const out: string[] = [];
  for (let i = 0; i < w.length; i++)
    for (let c = 97; c <= 122; c++) {
      const v = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
      if (v !== w && set.has(v)) out.push(v);
    }
  return out;
}

/** BFS distances from `from` to every word in its component. */
export function bfs(from: string): Map<string, number> {
  const dist = new Map([[from, 0]]);
  const q = [from];
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    for (const v of neighbors(u)) if (!dist.has(v)) { dist.set(v, dist.get(u)! + 1); q.push(v); }
  }
  return dist;
}

export function oneLetterDiff(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d === 1;
}
