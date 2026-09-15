import { bfs, neighbors, oneLetterDiff, isWord } from "./graph";
import { makePuzzle, dailyNumber, dayKey, type Puzzle } from "./puzzle";
import { load, save } from "./storage";

export type Mode = "daily" | "random";
export interface Session extends Puzzle { mode: Mode; seed: number; chain: string[]; hints: number; done: boolean }
export interface Stats { best: Record<number, number>; streak: number; lastDaily: string | null }

let S = $state<Session | null>(null);
let stats = $state<Stats>({ best: {}, streak: 0, lastDaily: null });
let distToTarget = new Map<string, number>();

export const game = {
  get s() { return S!; },
  get ready() { return S !== null; },
  get stats() { return stats; },
  get cur() { return S!.chain[S!.chain.length - 1]; },
  get steps() { return S!.chain.length - 1 + S!.hints; },
  get isTodayDaily() { return S?.mode === "daily" && S.seed === dailyNumber(); },

  async init() {
    stats = await load<Stats>("tk.stats", stats);
    const saved = await load<Session | null>("tk.session", null);
    if (saved && isWord(saved.start) && (saved.mode !== "daily" || saved.seed === dailyNumber())) setSession(saved);
    else this.newGame("daily");
  },

  newGame(mode: Mode) {
    const seed = mode === "daily" ? dailyNumber() : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    setSession({ mode, seed, ...makePuzzle(seed), chain: [], hints: 0, done: false });
    S!.chain = [S!.start];
    persist();
  },

  /** Returns error message (Indonesian) or null on success. */
  submit(raw: string): string | null {
    const w = raw.trim().toLowerCase();
    if (!w || S!.done) return null;
    if (w.length !== S!.start.length) return `Harus ${S!.start.length} huruf`;
    if (!oneLetterDiff(this.cur, w)) return "Ubah tepat satu huruf";
    if (!isWord(w)) return "Kata tidak ada di kamus";
    if (S!.chain.includes(w)) return "Kata sudah dipakai";
    push(w, false);
    return null;
  },

  hint() {
    if (S!.done) return;
    const d = distToTarget.get(this.cur)!;
    const next = neighbors(this.cur).find((v) => distToTarget.get(v) === d - 1);
    if (next) push(next, true);
  },

  undo() {
    if (S!.done || S!.chain.length < 2) return;
    S!.chain.pop();
    persist();
  },

  shareText(url: string) {
    const over = this.steps - S!.par;
    return `Tangga Kata ${S!.mode === "daily" ? `#${S!.seed}` : "(acak)"} · ${S!.start.length} huruf\n${S!.start.toUpperCase()} → ${S!.target.toUpperCase()}\n${this.steps} langkah, par ${S!.par} (${over === 0 ? "sempurna" : `+${over}`})\n${url}`;
  },
};

function setSession(s: Session) { S = s; distToTarget = bfs(s.target); }
function persist() { save("tk.session", $state.snapshot(S)); }

function push(w: string, isHint: boolean) {
  S!.chain.push(w);
  if (isHint) S!.hints++;
  if (w === S!.target) finish();
  persist();
}

function finish() {
  S!.done = true;
  const n = S!.start.length, over = game.steps - S!.par;
  if (stats.best[n] == null || over < stats.best[n]) stats.best[n] = over;
  if (S!.mode === "daily") {
    const today = dayKey(), y = new Date(); y.setDate(y.getDate() - 1);
    if (stats.lastDaily !== today) {
      stats.streak = stats.lastDaily === dayKey(y) ? stats.streak + 1 : 1;
      stats.lastDaily = today;
    }
  }
  save("tk.stats", $state.snapshot(stats));
}
