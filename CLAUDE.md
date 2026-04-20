# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hospyia is a multi-tenant SaaS platform for vacation rental property management built with Next.js 15, React 19, TypeScript, and Supabase.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local

# Run development server
npm run dev

# Run tests
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:security      # Security tests only
npm run test:coverage      # With coverage
```

## Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Auth, Postgres, RLS)
- **AI:** Google Gemini, OpenAI
- **Testing:** Vitest + Testing Library
- **Maps:** Mapbox GL

### Directory Structure
```
app/                    # Next.js App Router
  actions/              # Server Actions (auth, property operations)
  api/                  # API Routes (AI, translation, tracking)
  auth/                 # Auth pages (login, signup)
  dashboard/            # Protected dashboard pages
components/             # React components
  ui/                   # shadcn/ui primitives
  guide/                # Guest guide components (including extras/)
  dashboard/            # Dashboard-specific components
  auth/                 # Auth components
  properties/           # Property-specific components
lib/                    # Utilities and services
  supabase/             # Supabase clients (client, server, admin, edge, middleware)
  ai/
    clients/            # AI clients (gemini-rest, openai, brave, mapbox)
    services/           # AI services (embeddings, intent-classifier, translation-service, gemini-i18n)
  security/             # Security utilities (rate-limiter, security-policies)
  services/             # Business services (geocoding, logger, notifications)
  constants/            # App constants
  maps/                 # Map-related utilities
  discovery/            # Discovery utilities (airports, transit, stations)
  arrival/              # Arrival generator
types/                  # TypeScript type definitions
  database.ts           # Supabase database types
  api.ts                # API request/response types
  wizard.ts             # Wizard-specific types
  index.ts              # Re-exports all types
supabase/
  functions/            # Supabase Edge Functions
  migrations/           # SQL migrations
__tests__/              # Vitest tests
  security/             # OWASP Top 10 security tests
  integration/          # Integration tests
  unit/                 # Unit tests
documentacion/          # Project documentation
scripts/                # Maintenance and dev scripts
hooks/                  # React hooks
```

### Key Patterns

**Supabase Clients:**
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server component client (cookie-based)
- `lib/supabase/server-admin.ts` - Admin client with elevated privileges
- `lib/supabase/edge.ts` - Edge function client

**Authentication Flow:**
- Magic link authentication via Supabase Auth
- Session managed via HTTP-only cookies
- Middleware (`middleware.ts`) protects `/dashboard` routes
- Re-authentication required for sensitive actions (see `app/actions/reauthentication.ts`)

**Multi-Tenancy:**
- Row Level Security (RLS) enforced on all tenant tables
- `tenant_id` column on all data tables
- Policies verify `tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())`

**Server Actions:**
- Located in `app/actions/`
- Always validate authentication and tenant ownership
- Use `revalidatePath` from `next/cache` for cache invalidation

**TypeScript Types:**
- Import types from `@/types` (e.g., `import type { ApiResponse, ChatRequest } from '@/types'`)
- Database types are auto-generated from Supabase
- API types define request/response contracts for all endpoints

## Security Considerations

See `documentacion/SECURITY_AUDIT.md` for full audit report. Key requirements:

1. **All `/api/*` endpoints** must validate user session with `supabase.auth.getUser()`
2. **Server Actions** must verify tenant ownership before data access
3. **AI endpoints** require credit/token validation before processing
4. **XSS Prevention:** Sanitize rendered manual content with DOMPurify
5. **Prompt Injection:** Use system delimiters when passing user input to AI

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # For admin scripts only
```

## Common Operations

```bash
# Bundle analysis
npm run analyze

# Create admin magic link (dev, no email)
npm run dev:admin

# Create dev admin user
npm run dev:admin:create

# Translation maintenance
npm run translation:stats
npm run translation:cleanup

# Fix UTF-8 encoding issues
npm run fix-utf8

# Clean build artifacts
npm run clean

# Fresh start (clean + dev)
npm run fresh
```

## Testing Notes

- Tests use `jsdom` environment with React Testing Library
- Mocks configured in `setupTests.ts` for Next.js router, cookies, cache
- Security tests cover OWASP Top 10 categories
- Coverage reports in `coverage/` directory

## Documentation

- `documentacion/SECURITY_AUDIT.md` - Security audit report (OWASP Top 10)
- `documentacion/SUPABASE_SETUP.md` - Database setup guide
- `documentacion/RESEND_SETUP.md` - Email configuration
- `documentacion/JWT_EXPIRATION.md` - Token handling
- `documentacion/TROUBLESHOOTING.md` - Common issues
