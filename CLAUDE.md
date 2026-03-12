# open-housing

Slovak HOA (housing community) management app.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS v4
- PostgreSQL + Drizzle ORM — migrations in `drizzle/migrations/`
- NextAuth v5 (beta.30) — auth
- next-intl — i18n, locales: `sk` (default), `en`
- Docker + Caddy — deployment

## Structure
```
app/
  [locale]/
    dashboard/
      board/        # board of directors
      voting/       # voting (Slovak electronic voting law compliance)
      owners/       # unit owners
      settings/
      consent/      # data processing consent
      notifications/
lib/
  db/               # Drizzle schema + queries
  auth/             # NextAuth config
drizzle/
  migrations/       # SQL migrations
messages/
  sk.json           # Slovak strings (default)
  en.json
```

## Rules

### i18n
- ALL user-facing strings via `useTranslations()` / `getTranslations()`
- Never hardcode text in components
- Add new keys to both `sk.json` and `en.json`

### Database
- Schema changes always via `drizzle-kit generate` — never manual SQL
- Query functions in `lib/db/`, not inline in server actions
- Commit migrations together with schema changes

### Auth
- Session check via `auth()` in server components / server actions
- Protected routes via middleware (`matcher` in `middleware.ts`)

### Deployment
- Docker image → Docker Hub → Railway
- Caddy as reverse proxy
- Env vars: never commit `.env`, keep `.env.example` up to date

## Common commands
```bash
pnpm dev                    # dev server
pnpm db:generate            # generate migration after schema change
pnpm db:migrate             # apply migrations
pnpm db:studio              # Drizzle Studio
docker compose up           # local docker
```
