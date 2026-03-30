# MyMemex

## Run locally

Always start the app from `/Users/admin/Knowlegde_Per_Assis/MyMemex`.

### Normal startup

```bash
npm run dev
```

If `3000` is occupied, Next.js will automatically choose the next free port.

### If you see `Cannot find module './xxx.js'`

This is usually a Next.js development cache or hot-reload issue, not a database issue.

1. Stop all running `next dev` processes for this project.
2. Run:

```bash
npm run clean
npm run dev
```

### Stable verification

Use these commands to verify the project itself is healthy:

```bash
npm run typecheck
npm run build
npm run start
```

If `build` and `start` work but `dev` fails, treat it as a development cache/HMR issue first.
