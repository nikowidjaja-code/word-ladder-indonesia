# Tangga Kata — Word Ladder Indonesia

Ubah kata awal menjadi kata tujuan, satu huruf per langkah. Setiap kata harus ada di kamus.

Static site, no build step, no backend, 100% offline.

## Run
Open `index.html` directly, or serve the folder (`npx serve .`). GitHub Pages: Settings → Pages → branch `main`, folder `/ (root)`.

## Dictionary
`data/source.lst` = Ivan Lanin 2011 word list (public domain, via geovedi/indonesian-wordlist).
`node scripts/build-dict.mjs` filters to 3–6 letter root-ish words, keeps the giant connected component per length, writes `data/words.json` + `data/words.js`.
Optional `data/blocklist.txt` (one word per line) removes words before graph build.

Changing the dictionary changes daily puzzles (seeded by day number, deterministic over the word list).

## Android
Not yet. Plan: Capacitor wrapper around this folder. Privacy policy: `privacy.html`.
