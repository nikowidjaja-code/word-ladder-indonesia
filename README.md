# Tangga Kata — Word Ladder Indonesia

Ubah kata awal menjadi kata tujuan, satu huruf per langkah. Setiap kata harus ada di kamus.

Svelte 5 + TypeScript + Vite. PWA (offline, installable). Capacitor for Android. No backend.

## Dev
```
npm i
npm run dev        # http://localhost:2135
npm test           # node --test, no framework
npm run check      # svelte-check
npm run build      # dist/
```

## Dictionary
`data/source.lst` = Ivan Lanin 2011 word list (public domain, via geovedi/indonesian-wordlist).
`npm run dict` filters to 3–6 letter root-ish words, keeps giant connected component per length → `data/words.json` (bundled into app).
Optional `data/blocklist.txt` (one word per line) removes words before graph build.
Changing the dictionary changes daily puzzles (seeded by day number, deterministic over the word list).

## Web deploy
GitHub Actions builds + deploys `dist/` to Pages on push to `main`. Enable once: Settings → Pages → Source: **GitHub Actions**.

## Android (Capacitor)
Needs Android Studio / SDK + JDK 17 on the build machine.
```
npx cap add android          # once; android/ is gitignored, re-add on fresh clone or commit it
npm run cap:sync             # build web + copy into android/
npx cap open android         # build AAB in Android Studio
```
Storage uses `@capacitor/preferences` (SharedPreferences on Android, localStorage on web). Share uses `@capacitor/share` (native sheet on Android, clipboard on web).
Replace `public/icon-*.png` placeholders with real art before store submission. Privacy policy: `public/privacy.html`.
