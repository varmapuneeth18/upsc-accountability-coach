# UPSC Accountability Coach

Monorepo with two deployable pieces:

- **`frontend/`** — Next.js app, deployed to Vercel. Calls the backend via
  `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.local.example`).
- **`backend/`** — Express + node-postgres API, deployed to Render. Talks to
  a Postgres database (see `backend/.env.example`).

## Local development

1. Start Postgres and create a database, then:
   ```
   cd backend
   cp .env.example .env   # fill in DATABASE_URL
   npm install
   npm run dev             # http://localhost:4000
   ```
2. In another terminal:
   ```
   cd frontend
   cp .env.local.example .env.local  # defaults to http://localhost:4000
   npm install
   npm run dev             # http://localhost:3000
   ```

## Deployment

See the deployment instructions provided alongside this repo for the full
Supabase → Render → Vercel walkthrough.
