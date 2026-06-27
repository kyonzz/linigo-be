# API Contract: Authentication Guard

## Overview

All protected endpoints require a valid Supabase JWT in the `Authorization` header.
Public endpoints are unaffected.

---

## Protected Endpoints

| Method | Path | Auth Required |
|--------|------|--------------|
| POST | `/api/v1/translate` | ✅ Yes |
| POST | `/api/v1/lookup` | ✅ Yes |

## Public Endpoints (unchanged)

| Method | Path | Auth Required |
|--------|------|--------------|
| GET | `/api/v1/health` | ❌ No |
| GET | `/api/v1/languages` | ❌ No |

---

## Request: Authorization Header

```
Authorization: Bearer <supabase-access-token>
```

- Scheme must be `Bearer` (case-insensitive)
- Token is a Supabase-issued JWT (HS256)
- Token must not be expired

---

## Response: Authentication Failure

**Status**: `401 Unauthorized`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Provide a valid Bearer token."
  }
}
```

This response is returned for:
- Missing `Authorization` header
- Header present but not `Bearer` scheme
- Malformed JWT (cannot be decoded)
- Expired JWT
- Invalid signature

---

## Response: Successful Authentication

No change to the existing success response shape of each endpoint.
The authenticated user's identity (`sub`, `email`) is available server-side but
not echoed back in the response body.

---

## Error Codes

| HTTP Status | `error.code` | Condition |
|-------------|--------------|-----------|
| `401` | `UNAUTHORIZED` | Token missing, malformed, expired, or signature invalid |
