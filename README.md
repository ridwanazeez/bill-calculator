# Bill calculator

Counts Guyana dollar bills. Enter how many of each note you have and the totals update as you type.

Live: https://ridwanazeez.com/bill-calculator/

```sh
npm install
npm run dev                  # http://localhost:5173/bill-calculator/
npm run test:unit -- --run
npm run build
CI=1 npm run test:e2e -- --project=chromium   # after a build
npm run lint
```

Pushing to `master` deploys over FTP. It needs four repository secrets: `FTP_SERVER`, `FTP_USERNAME`,
`FTP_PASSWORD` and `FTP_DIRECTORY`, which must end in `bill-calculator/`.
