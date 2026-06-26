# AGENTS.md

## Cursor Cloud specific instructions

This repo is the legacy **ethereum.org "Homestead Release"** static marketing/tutorial
website. It is a small Express + Pug site whose pages are pre-rendered into `dist/` by a
Grunt build, and Express just serves the static `dist/` output.

### Services / how to run
- **Web server**: `npm start` runs `node ./bin/www` and listens on **port 3000** (override
  with `PORT`). Note: `app.js` defaults the Express app to 8080, but `bin/www` overrides it to
  3000, so the dev server is on 3000. Routes are defined in `app.js`.
- **Build**: `npm run build` (a.k.a. `npx grunt`) compiles `views/*.pug` → `dist/*.html`,
  copies/minifies assets, and concatenates CSS/JS into `dist/css/app.min.css` and
  `dist/js/app.min.js`. The built `dist/` directory **is committed to git**, so the server can
  run without rebuilding.
- There are **no automated tests and no linter** configured (`package.json` has only
  `build`, `start`, `start:dist`, `check-links`). `npm test` fails with "Missing script".
  `npm run check-links` runs broken-link-checker against the built site and needs network.

### Non-obvious gotchas
- **Do not interrupt the `grunt` build.** The CSS pipeline ends with `concat:css` +
  `clean:cleanup_css`; if the build is killed partway (e.g. piping its stdout through `head`,
  which sends SIGPIPE, or Ctrl-C), `dist/` is left half-built with a broken/tiny
  `dist/css/app.min.css` and the served site renders as **unstyled raw HTML**. If styling looks
  broken, run a full `npx grunt` again, or `git checkout -- dist/` to restore the committed
  build. A healthy `dist/css/app.min.css` is ~110 KB.
- The first Grunt step `http:fetch_mist_releases` calls the GitHub API
  (`api.github.com/repos/ethereum/mist/releases/latest`) and writes `data/mist_releases.json`,
  which the Pug build then reads. This needs network access; set `GITHUB_TOKEN_RELEASES` to
  avoid rate limits if it starts failing. A committed `data/mist_releases.json` already exists.
- `package.json` `engines` pins node 6 / npm 3.8.6, but those are ignored — the site builds and
  runs fine on modern Node (verified on Node 22).
- Running the build regenerates `dist/` and refreshes `data/mist_releases.json` and may touch
  `package-lock.json`; these are build artifacts/churn — avoid committing them unless intended.
