# KloudPG (React + Vite)

This project has been converted from Next.js to a React.js app powered by Vite.

## Tech Stack

- React 19
- Vite 6
- React Router
- Existing SQLite/auth/business logic via adapted `src/app/api/**/route.js` handlers

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open in browser:

- `http://localhost:5173`

## Build

```bash
npm run build
```

## Notes About API Routes

The previous Next.js route handlers are still used and are mounted through a Vite middleware adapter:

- API source: `src/app/api/**/route.js`
- Runtime adapter: `vite.config.js` (`next-api-adapter` plugin)
- Next response shim: `src/shims/next-server.js`

This keeps your existing auth/db logic working while running as a React/Vite project.
