# MyMemex

## Run locally

Always start the app from `/Users/admin/Knowlegde_Per_Assis/MyMemex`.

### Normal startup

```bash
npm run dev
```

Before starting, make sure `.env` contains:

```bash
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
INSFORGE_BASE_URL=https://your-app.region.insforge.app
INSFORGE_ANON_KEY=your-insforge-anon-key
```

Production deploys in this workspace use [.env.production](/Users/admin/Knowlegde_Per_Assis/MyMemex/.env.production) with the default Vercel domain `https://my-memex.vercel.app`.
Mirror the same values into the Vercel project's Production environment variables before the first live release.

Before first run, create the InsForge tables with [insforge/schema.sql](/Users/admin/Knowlegde_Per_Assis/MyMemex/insforge/schema.sql).

If you are using the InsForge SQL tool, run the whole file once, then start the app.

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
