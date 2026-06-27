# Research: Supabase Authentication Guard

## Supabase JWT Format

**Decision**: Verify tokens using `jose` with the Supabase JWT secret (HS256).

**Rationale**: Supabase issues HS256 JWTs signed with a project-specific secret (`SUPABASE_JWT_SECRET`).
This secret is available in the Supabase dashboard under Project Settings → API.
Verification is a pure in-process HMAC check — no network call to Supabase required.
`jose` is the recommended ESM-native library for JWT operations in Node.js; it has no
transitive dependencies, supports all standard algorithms, and handles expiry checking
automatically.

**Alternatives considered**:
- `jsonwebtoken`: CommonJS-first, requires wrapper for ESM; `jose` is the cleaner choice.
- Calling Supabase REST API to validate tokens: adds network latency and a hard dependency on Supabase availability; unnecessary when we own the secret.
- Using `@supabase/supabase-js` server client: brings in a large SDK for a task that only needs `jwtVerify`; over-engineered.

---

## Fastify Auth Pattern

**Decision**: Implement auth as a Fastify plugin that exposes a `verifyAuth` decorator, applied per-route via `preHandler`.

**Rationale**: Fastify's `preHandler` hook runs after parsing but before the route handler, making it the correct interception point. Registering auth as a plugin (with `fastify-plugin` to break encapsulation) lets any route import and use `verifyAuth` without coupling `index.ts` to auth logic. This satisfies Single Responsibility (Principle I).

**Route-level application** (not global): Health and Languages routes must remain public.
Applying `preHandler` only on `translate` and `lookup` routes makes the whitelist explicit in code rather than a runtime exclusion list — simpler and less error-prone.

**Alternatives considered**:
- Global `onRequest` hook with route exclusion list: harder to audit, easy to forget new public routes.
- Fastify `@fastify/auth` plugin: useful for complex multi-strategy auth but unnecessary overhead here; one strategy only.

---

## Error Response

**Decision**: Return `401 Unauthorized` with `{ data: null, error: { code: "UNAUTHORIZED", message: "..." } }` for all token failures (missing, malformed, expired).

**Rationale**: Consistent with the project's existing error envelope (Principle III). `401` is correct for "not authenticated"; `403` would mean "authenticated but not allowed" — not applicable here.

**Fail-closed on Supabase outage**: Not applicable because verification is local (HMAC). No network call is made, so Supabase downtime cannot cause a 503. If the `SUPABASE_JWT_SECRET` env var is missing at startup, the process will crash at boot (same pattern as `GEMINI_API_KEY`).

---

## Environment Variable

**Decision**: Add `SUPABASE_JWT_SECRET` to `src/config/index.ts` using the existing `require()` helper.

**Rationale**: Consistent with how `GEMINI_API_KEY` is managed — fail fast at startup if missing.
