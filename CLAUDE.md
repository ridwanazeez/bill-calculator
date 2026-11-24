# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Always do first

Before writing or changing any UI, invoke each of these skills **if the user has it installed**
(skip the ones missing from the available-skills list, do not install them unasked):

1. **UI/UX Pro Max**: `ui-ux-pro-max:ui-ux-pro-max`
2. **Frontend design**: `frontend-design:frontend-design`
3. **Taste**: `design-taste-frontend`

When they conflict: this file wins, then the design system below, then the skills. This is a
one-screen utility, so ignore marketing-page rules (heroes, stock photography, section plans)
and apply the rest: type, spacing, contrast, hover/focus, copy, responsive checks.

## What this is

A cash counter that replaces a spreadsheet. The user enters how many of each Guyanese bill they
have; row totals and the total update **as they type**. There is no
calculate or submit button, and there must never be one.

| Spreadsheet            | App                                              |
| ---------------------- | ------------------------------------------------ |
| BILL / AMOUNT / TOTAL  | one table row per entry in `DENOMINATIONS`       |
| TOTAL                  | `total`: the sum of bill × amount                |

Live at https://ridwanazeez.com/bill-calculator/.

## Stack

Vue 3 (`<script setup>`), Pinia, Vite, plain CSS. Vitest for units, Playwright for e2e.
No router, no Tailwind, no component library: keep it that way unless asked.

```
src/stores/bills.js      all state, parsing, totals, localStorage persistence
src/App.vue              the whole UI
src/assets/main.css      tokens, @font-face, base styles
src/assets/fonts/        self-hosted woff2, shared with ridwanazeez.com
src/__tests__/           unit tests
e2e/                     Playwright
```

## Commands

```sh
npm run dev               # http://localhost:5173/bill-calculator/
npm run build
npm run test:unit -- --run
CI=1 npm run test:e2e -- --project=chromium   # needs a build first
npm run lint
npm run format
```

Run unit tests, lint and build before pushing.

## Conventions

- Money logic lives in the store, never in the template. Any change to it needs a unit test.
- Parse at the input: counts are whole, non-negative numbers.
- The page footer shows `version` from `package.json`. Bump it with
  `npm version <patch|minor> --no-git-tag-version` on every release.
- State persists in `localStorage` under `bill-calculator`. Treat what is read back as untrusted.
  Wrap storage access in try/catch.
- The theme shares the `vueuse-color-scheme` key with the other ridwanazeez.com apps
  (same origin). `index.html` reads it before first paint. Do not rename it.
- Style with the `var(--…)` tokens in `main.css`; no raw hex in components. Check light and dark,
  and 390px and 1440px widths.
- Prettier: no semicolons, single quotes, 100 columns.

## Deploy

Same as `salary-calculator`: pushing to `master` runs `.github/workflows/deploy.yml`, which builds
and uploads `dist/` over FTP. Vite `base` is `/bill-calculator/`, so import assets or use `%BASE_URL%`;
never hardcode a root-absolute path.

Repository secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_DIRECTORY`.
`FTP_DIRECTORY` must end in `bill-calculator/`. The workflow refuses to upload otherwise, because the
salary calculator's value would overwrite that app.
