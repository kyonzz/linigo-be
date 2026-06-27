# Feature Specification: Supabase Authentication Guard

**Feature Branch**: `002-supabase-auth`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "i use supabase for database also as authentication, I want only authenticated users can request those API"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Request Succeeds (Priority: P1)

A user who has signed in via Supabase receives a JWT access token from the client. They include this token as a Bearer header when calling `/api/v1/translate` or `/api/v1/lookup`. The API validates the token and returns the expected response.

**Why this priority**: This is the core guard behavior — every other story depends on it working correctly first.

**Independent Test**: Can be fully tested by sending a valid Supabase JWT to any protected endpoint and confirming the expected 2xx response and data are returned.

**Acceptance Scenarios**:

1. **Given** a valid Supabase JWT in the `Authorization: Bearer <token>` header, **When** the client calls `POST /api/v1/translate`, **Then** the API returns `200 OK` with the translation result.
2. **Given** a valid Supabase JWT, **When** the client calls `POST /api/v1/lookup`, **Then** the API returns `200 OK` with the dictionary entry.

---

### User Story 2 - Unauthenticated Request Is Rejected (Priority: P1)

A client that sends a request without any `Authorization` header (or with a missing/malformed token) receives a `401 Unauthorized` response and cannot access protected resources.

**Why this priority**: Equal priority to the happy path — without rejection, the guard provides no security.

**Independent Test**: Send a request with no header, an empty header, and a syntactically wrong header to any protected endpoint; all must return `401`.

**Acceptance Scenarios**:

1. **Given** no `Authorization` header, **When** the client calls `POST /api/v1/translate`, **Then** the API returns `401 Unauthorized` with a clear error message.
2. **Given** `Authorization: Bearer invalidtoken`, **When** the client calls `POST /api/v1/lookup`, **Then** the API returns `401 Unauthorized`.
3. **Given** an expired Supabase JWT, **When** any protected endpoint is called, **Then** the API returns `401 Unauthorized`.

---

### User Story 3 - Health Endpoint Remains Public (Priority: P2)

The `/api/v1/health` and `/api/v1/languages` endpoints do not require authentication so that monitoring tools and the client app (to populate language lists) can call them freely.

**Why this priority**: Operational necessity — health checks and reference data should not require login.

**Independent Test**: Call `/api/v1/health` with no token; confirm `200 OK` is returned.

**Acceptance Scenarios**:

1. **Given** no `Authorization` header, **When** the client calls `GET /api/v1/health`, **Then** the API returns `200 OK`.
2. **Given** no `Authorization` header, **When** the client calls `GET /api/v1/languages`, **Then** the API returns `200 OK`.

---

### Edge Cases

- What happens when the `Authorization` header is present but uses a scheme other than `Bearer` (e.g., `Basic ...`)? → Reject with `401`.
- What happens if the Supabase JWT signing key is rotated mid-deployment? → Token verification fails and returns `401`; no silent acceptance of stale keys.
- What happens when Supabase's JWKS/verification endpoint is temporarily unreachable? → Fail closed: return `503 Service Unavailable` so that a degraded auth service never silently allows unauthenticated access.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reject requests to `POST /api/v1/translate` and `POST /api/v1/lookup` that do not carry a valid authentication credential, returning `401 Unauthorized`.
- **FR-002**: System MUST accept requests to protected endpoints that carry a valid, non-expired Supabase-issued JWT and forward them to the handler.
- **FR-003**: System MUST leave `GET /api/v1/health` and `GET /api/v1/languages` publicly accessible without any credential.
- **FR-004**: System MUST validate JWTs cryptographically using the Supabase project's public key material, not by trusting the token's payload alone.
- **FR-005**: System MUST return a structured error envelope (`{ "data": null, "error": { "code": "UNAUTHORIZED", "message": "..." } }`) for all authentication failures, consistent with the existing API contract.
- **FR-006**: System MUST NOT expose token validation errors, internal key material, or stack traces in any error response.
- **FR-007**: System MUST return `503 Service Unavailable` if the authentication dependency is unreachable and a valid credential cannot be verified (fail-closed behavior).

### Key Entities

- **JWT (Access Token)**: Short-lived token issued by Supabase after a successful sign-in. Contains a user identifier (`sub`) and expiry (`exp`). Signed with the project's secret.
- **Protected Endpoint**: Any route under `/api/v1` except `health` and `languages`.
- **Public Endpoint**: Routes that bypass authentication: `/api/v1/health`, `/api/v1/languages`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of requests to protected endpoints without a valid token are rejected with `401` — zero false negatives (unauthenticated access) under all tested conditions.
- **SC-002**: 100% of requests with a valid token are accepted — zero false positives (authenticated users blocked).
- **SC-003**: Authentication validation adds no more than 50ms of latency at p95 to any protected endpoint call.
- **SC-004**: Public endpoints (`health`, `languages`) remain accessible without credentials in all test runs.
- **SC-005**: All authentication-related error responses conform to the standard error envelope format (verifiable by contract tests).

## Assumptions

- Supabase is already configured for this project and the project's JWT secret is available as an environment variable.
- Clients (mobile/web) handle sign-in directly via the Supabase client SDK and obtain a JWT before calling this API; this service is not responsible for issuing tokens.
- Token refresh is the client's responsibility; the API only validates, never refreshes.
- All current protected endpoints are `POST /api/v1/translate` and `POST /api/v1/lookup`; any new endpoints added in the future are protected by default unless explicitly exempted.
- Role-based access control (RBAC) or per-user authorization beyond "is authenticated" is out of scope for this feature.
