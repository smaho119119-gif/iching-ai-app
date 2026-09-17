# Codex persistent instructions — I Ching AI app

## Default workflow

- When asked to build, publish, deploy, configure Vercel/Supabase, or make the app usable, inspect installed CLIs and their existing authenticated sessions first. Use the user's existing secure CLI credentials automatically; never ask them to paste tokens or print tokens into output.
- Read this file and `README.md`, check `git status`, run the project checks, then proceed without asking for routine deployment confirmation when the user has requested deployment.
- Target Vercel project: `iching-ai-app`, team `hirokis-projects-f7ba11f1`, Tokyo region `hnd1`; prefer linking the existing project over creating duplicates. Deploy the connected GitHub `main` revision to Production, then verify the deployment URL and `/api/health`.
- Target Supabase is a dedicated project in Tokyo (`ap-northeast-1`). Never reuse another app's database/project without explicit user direction. Before SQL writes, inspect existing tables and only create idempotent objects with the `iching_ai_app_` prefix. Enable RLS; expose no anon policies for operational tables. Keep service-role keys server-only.
- Use Vercel Cron only for the configured daily authenticated health check; do not claim it guarantees an always-awake Vercel Function or prevents Supabase Free auto-pausing. For reliable no-pause database service, configure an appropriate paid Supabase plan, and disclose any cost-bearing action before provisioning/upgrading.
- Preserve API keys in OS/CLI or hosting secret stores. Never write secrets to Git, app source, Codex memory, logs, or client-visible `NEXT_PUBLIC_` variables.
- After deployment, verify production build, core page, handwritten page, health endpoint, configured API/DB path, and report clearly what could not be tested.

## Current deployment checkpoint (2026-09-17)

- Vercel project `iching-ai-app` has been created and linked locally. Project ID is stored in ignored `.vercel/project.json`; do not commit `.vercel` or expose tokens.
- `VERCEL_TOKEN` is available in the shell secure environment; invoke Vercel CLI with it without displaying its value.
- Supabase CLI is installed, but this task did not find an authenticated Management API token. Do not reuse the unrelated Tokyo projects shown by cached CLI output. Resume by locating the existing secure Supabase CLI/Claude credential or asking the user to authenticate if unavailable.
- `supabase/schema.sql` and the keepalive route use the collision-resistant table `iching_ai_app_keepalive`.
- The app has not yet been deployed to Production. Before deploying, finish the latest prefixed-schema edits, lint/verify/build, set an unpredictable `CRON_SECRET` in Vercel Production, connect `smaho119119-gif/iching-ai-app` GitHub repo (if supported), deploy with `vercel --prod`, and verify `/api/health`. Supabase keepalive remains inactive until dedicated Tokyo project credentials and prefixed SQL setup are completed.
