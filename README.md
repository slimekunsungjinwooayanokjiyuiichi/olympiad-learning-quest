# Olympiad Learning Quest

Vite/React learning app with automatic AI model routing and optional Supabase progress sync.

## Setup

1. Run `npm ci` and `npm run build`.
2. Create a Supabase free project. In Authentication → Providers, enable Anonymous sign-ins.
3. Run `supabase/migrations/20260926000000_learner_progress.sql` in the Supabase SQL editor.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the publishable client key) in Vercel Production, Preview, and Development environment variables. Never use a service role key in a `VITE_` variable.
5. Import this GitHub repository into Vercel with root directory `/`, Vite framework, build command `npm run build`, and output directory `dist`.
6. Enable Vercel OIDC for AI Gateway or set `AI_GATEWAY_API_KEY` as a Vercel server secret. Redeploy after changing environment variables.

Progress is kept in local storage when Supabase is not configured. Anonymous Supabase accounts are browser-specific; clearing browser data can lose access to synced progress. Add account sign-in to provide durable cross-device access.
