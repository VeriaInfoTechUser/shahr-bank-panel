# GRC Context API — Full Specification

> Use this document as a reference to design and build the frontend for the GRC (Governance, Risk & Compliance) context management system.

---

## Overview

This API manages a hierarchical compliance structure:

```
Framework (e.g., ISO 27001, CIS Controls v8)
  └── Domain (e.g., Data Security, Access Control)
        └── Control (e.g., Access Review, Encryption Policy)
```

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:** JWT Bearer token in `Authorization` header.

---

## Authentication

### Login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "result": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
  },
  "error": []
}
```

### Refresh Token

```
POST /api/v1/auth/refresh
Authorization: Bearer <refreshToken>
Content-Type: application/json
```

### Using the Token

All GRC endpoints require:
```
Authorization: Bearer <accessToken>
```

---

## Data Hierarchy

| Level | Entity | `type` | `source` | Parent Link | Description |
|-------|--------|--------|----------|-------------|-------------|
| 1 | Framework | `framework` | `context` | — | Top-level compliance standard (ISO, CIS, NIST) |
| 2 | Domain | `domain` | `framework` | `frameworkSlug` | Group of controls within a framework |
| 3 | Control | `control` | `domain` | `domainSlug` + `frameworkSlug` | Specific security control/requirement |

**Relationships:**
- A Framework has many Domains
- A Domain has many Controls
- A Control belongs to one Domain and one Framework
- `parentSlug` links to the immediate parent (framework→domain, domain→control)

---

## Enums & Constants

### Status
| Value | Meaning |
|-------|---------|
| `1` | Active |
| `0` | Inactive |

### State
| Value | Meaning |
|-------|---------|
| `draft` | Work in progress |
| `published` | Published and active |
| `archived` | No longer active |

---

## Unified Response Format

All endpoints return:

```json
{
  "result": true | false,
  "data": <object | array | null>,
  "error": ["error message"]
}
```

### Paginated List Response

```json
{
  "result": true,
  "data": {
    "list": [ ... ],
    "paginator": {
      "count": 246,
      "limit": 20,
      "page": 1
    }
  },
  "error": []
}
```

### Error Response

```json
{
  "result": false,
  "data": null,
  "error": ["Framework \"invalid-slug\" not found"]
}
```

---

## Entity Models

### FrameworkResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | Auto-generated ID |
| slug | string | ✓ | Unique identifier (e.g., `iso-27001`) |
| type | string | ✓ | Always `framework` |
| source | string | ✓ | Always `context` |
| status | number | ✓ | `1` = active, `0` = inactive |
| state | string | | `draft`, `published`, `archived` |
| parentSlug | string | | null for frameworks |
| tenantId | number | | Multi-tenant ID |
| title | string | | Display name (e.g., "ISO/IEC 27001:2022") |
| number | string | | Standard number (e.g., "ISO27001:2022") |
| summary | string | | Short description |
| version | string | | Version year/number |
| description | string | | Full description |
| controlCount | number | | Number of controls in this framework |
| domainsCount | number | | Number of domains in this framework |
| createdBy | number | | User ID who created |
| updatedBy | number | | User ID who last updated |
| createdAt | Date | ✓ | ISO 8601 timestamp |
| updatedAt | Date | ✓ | ISO 8601 timestamp |

### DomainResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | Auto-generated ID |
| slug | string | ✓ | Unique identifier (e.g., `data-security`) |
| type | string | ✓ | Always `domain` |
| source | string | ✓ | Always `framework` |
| status | number | ✓ | `1` = active, `0` = inactive |
| state | string | | `draft`, `published`, `archived` |
| parentSlug | string | | Parent framework slug |
| tenantId | number | | Multi-tenant ID |
| title | string | | Display name (e.g., "Data Security") |
| number | string | | Section number (e.g., "A.8") |
| summary | string | | Short description |
| version | string | | Version year/number |
| description | string | | Full description |
| frameworkSlug | string | | Parent framework reference |
| controlCount | number | | Number of controls in this domain |
| createdBy | number | | User ID who created |
| updatedBy | number | | User ID who last updated |
| createdAt | Date | ✓ | ISO 8601 timestamp |
| updatedAt | Date | ✓ | ISO 8601 timestamp |

### ControlResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | Auto-generated ID |
| slug | string | ✓ | Unique identifier (e.g., `access-review`) |
| type | string | ✓ | Always `control` |
| source | string | ✓ | Always `domain` |
| status | number | ✓ | `1` = active, `0` = inactive |
| state | string | | `draft`, `published`, `archived` |
| parentSlug | string | | Parent domain slug |
| tenantId | number | | Multi-tenant ID |
| title | string | | Display name (e.g., "Access Review") |
| number | string | | Control number (e.g., "A.8.1") |
| summary | string | | Short description |
| version | string | | Version year/number |
| description | string | | Full description |
| frameworkSlug | string | | Parent framework reference |
| domainSlug | string | | Parent domain reference |
| createdBy | number | | User ID who created |
| updatedBy | number | | User ID who last updated |
| createdAt | Date | ✓ | ISO 8601 timestamp |
| updatedAt | Date | ✓ | ISO 8601 timestamp |

---

## Endpoints Reference

### Frameworks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/grc/frameworks` | List all frameworks | ✓ |
| GET | `/grc/frameworks/:slug` | Get single framework | ✓ |
| POST | `/grc/frameworks` | Create framework | ✓ |
| PUT | `/grc/frameworks/:slug` | Update framework | ✓ |
| DELETE | `/grc/frameworks/:slug` | Delete framework | ✓ |

### Domains

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/grc/domains` | List all domains | ✓ |
| GET | `/grc/domains/:slug` | Get single domain | ✓ |
| POST | `/grc/domains` | Create domain | ✓ |
| PUT | `/grc/domains/:slug` | Update domain | ✓ |
| DELETE | `/grc/domains/:slug` | Delete domain | ✓ |

### Controls

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/grc/controls` | List all controls | ✓ |
| GET | `/grc/controls/:slug` | Get single control | ✓ |
| POST | `/grc/controls` | Create control | ✓ |
| PUT | `/grc/controls/:slug` | Update control | ✓ |
| DELETE | `/grc/controls/:slug` | Delete control | ✓ |

---

## Query Parameters

### List Endpoints (GET)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | `1` | Page number |
| limit | number | `20` | Items per page |
| status | number | | Filter by status (`1` or `0`) |

**Example:** `GET /grc/frameworks?page=1&limit=10&status=1`

---

## Request Payloads

### Create Framework — `POST /grc/frameworks`

```json
{
  "slug": "iso-27001",
  "status": 1,
  "state": "draft",
  "title": "ISO/IEC 27001:2022",
  "number": "ISO27001:2022",
  "summary": "Information security management systems — Requirements",
  "version": "2022",
  "description": "ISO/IEC 27001 specifies the requirements for establishing, implementing, maintaining and continually improving an information security management system.",
  "controlCount": 93,
  "domainsCount": 4,
  "createdBy": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| slug | string | ✓ | unique, max 255 |
| status | number | ✓ | min 0 |
| state | string | | max 100 |
| parentSlug | string | | max 255 |
| tenantId | number | | |
| title | string | | |
| number | string | | |
| summary | string | | |
| version | string | | |
| description | string | | |
| controlCount | number | | |
| domainsCount | number | | |
| createdBy | number | | |

### Update Framework — `PUT /grc/frameworks/:slug`

All fields optional. Only send fields to update.

```json
{
  "status": 1,
  "state": "published",
  "summary": "Updated summary",
  "controlCount": 95
}
```

### Create Domain — `POST /grc/domains`

```json
{
  "slug": "data-security",
  "status": 1,
  "state": "draft",
  "parentSlug": "iso-27001",
  "title": "Data Security",
  "number": "A.8",
  "summary": "Controls related to data protection and privacy",
  "version": "2022",
  "description": "Domain covering data security controls.",
  "frameworkSlug": "iso-27001",
  "controlCount": 8,
  "createdBy": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| slug | string | ✓ | unique, max 255 |
| status | number | ✓ | min 0 |
| state | string | | max 100 |
| parentSlug | string | | max 255 (framework slug) |
| tenantId | number | | |
| title | string | | |
| number | string | | |
| summary | string | | |
| version | string | | |
| description | string | | |
| frameworkSlug | string | | parent framework reference |
| controlCount | number | | |
| createdBy | number | | |

### Update Domain — `PUT /grc/domains/:slug`

```json
{
  "state": "published",
  "controlCount": 10
}
```

### Create Control — `POST /grc/controls`

```json
{
  "slug": "access-review",
  "status": 1,
  "state": "draft",
  "parentSlug": "data-security",
  "title": "Access Review",
  "number": "A.8.1",
  "summary": "Regular review of user access rights",
  "version": "2022",
  "description": "Access rights shall be reviewed at regular intervals and removed when no longer needed.",
  "frameworkSlug": "iso-27001",
  "domainSlug": "data-security",
  "createdBy": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| slug | string | ✓ | unique, max 255 |
| status | number | ✓ | min 0 |
| state | string | | max 100 |
| parentSlug | string | | max 255 (domain slug) |
| tenantId | number | | |
| title | string | | |
| number | string | | |
| summary | string | | |
| version | string | | |
| description | string | | |
| frameworkSlug | string | | parent framework reference |
| domainSlug | string | | parent domain reference |
| createdBy | number | | |

### Update Control — `PUT /grc/controls/:slug`

```json
{
  "state": "published",
  "description": "Updated description"
}
```

### Delete (any entity) — `DELETE /grc/{entity}/:slug`

No body required. Returns:
```json
{
  "result": true,
  "data": null,
  "error": []
}
```

---

## Full Response Examples

### Single Entity (GET /grc/frameworks/iso-27001)

```json
{
  "result": true,
  "data": {
    "id": 1,
    "slug": "iso-27001",
    "type": "framework",
    "source": "context",
    "status": 1,
    "state": "published",
    "parentSlug": null,
    "tenantId": null,
    "title": "ISO/IEC 27001:2022",
    "number": "ISO27001:2022",
    "summary": "Information security management systems — Requirements",
    "version": "2022",
    "description": "ISO/IEC 27001 specifies the requirements...",
    "controlCount": 93,
    "domainsCount": 4,
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2026-06-14T08:57:26.441Z",
    "updatedAt": "2026-06-14T08:57:26.441Z"
  },
  "error": []
}
```

### Paginated List (GET /grc/controls?page=1&limit=2)

```json
{
  "result": true,
  "data": {
    "list": [
      {
        "id": 270,
        "slug": "cis-v8-18-safeguard-05",
        "type": "control",
        "source": "domain",
        "status": 1,
        "state": null,
        "parentSlug": "cis-v8-control-18",
        "tenantId": null,
        "title": "Perform Periodic Internal Penetration Tests",
        "number": "18.5",
        "summary": null,
        "version": "8.1",
        "description": "This control highlights the value of...",
        "frameworkSlug": "cis-controls-v8-1",
        "domainSlug": "cis-v8-control-18",
        "createdBy": 1,
        "updatedBy": 1,
        "createdAt": "2026-06-14T08:57:26.819Z",
        "updatedAt": "2026-06-14T08:57:26.819Z"
      },
      {
        "id": 269,
        "slug": "cis-v8-18-safeguard-04",
        "type": "control",
        "source": "domain",
        "status": 1,
        "state": null,
        "parentSlug": "cis-v8-control-18",
        "tenantId": null,
        "title": "Validate Security Measures",
        "number": "18.4",
        "summary": null,
        "version": "8.1",
        "description": "This control emphasizes the importance...",
        "frameworkSlug": "cis-controls-v8-1",
        "domainSlug": "cis-v8-control-18",
        "createdBy": 1,
        "updatedBy": 1,
        "createdAt": "2026-06-14T08:57:26.818Z",
        "updatedAt": "2026-06-14T08:57:26.818Z"
      }
    ],
    "paginator": {
      "count": 246,
      "limit": 2,
      "page": 1
    }
  },
  "error": []
}
```

---

## Error Codes

| HTTP | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET, PUT, DELETE |
| 201 | Created | POST |
| 400 | Validation error | Missing required field |
| 401 | Unauthorized | Invalid/missing token |
| 404 | Not Found | Slug doesn't exist |
| 500 | Server error | Internal error |

**Validation error example:**
```json
{
  "result": false,
  "data": null,
  "error": ["slug should not be empty", "status must not be less than 0"]
}
```

**Not found example:**
```json
{
  "result": false,
  "data": null,
  "error": ["Framework \"non-existent\" not found"]
}
```

---

## Frontend Design Notes

### Suggested Page Structure

1. **Frameworks List** — `GET /grc/frameworks` → table/grid of frameworks
2. **Framework Detail** — `GET /grc/frameworks/:slug` → shows framework + linked domains
3. **Domains List** — `GET /grc/domains?status=1` → filtered by framework via `frameworkSlug`
4. **Domain Detail** — `GET /grc/domains/:slug` → shows domain + linked controls
5. **Controls List** — `GET /grc/controls?status=1` → filtered by domain via `domainSlug`
6. **Control Detail** — `GET /grc/controls/:slug` → full control details

### Navigation Flow

```
Frameworks Page
  └── Click Framework → Domains Page (filter by frameworkSlug)
        └── Click Domain → Controls Page (filter by domainSlug)
              └── Click Control → Control Detail Page
```

### Filtering

To get domains for a specific framework, use `parentSlug`:
```
GET /grc/domains?status=1
→ Filter client-side where parentSlug === "iso-27001"
```

To get controls for a specific domain:
```
GET /grc/controls?status=1
→ Filter client-side where parentSlug === "data-security"
```

### CRUD Operations

- **Create:** Open form → POST → redirect to detail/list
- **Edit:** Load entity by slug → PUT with changed fields → refresh
- **Delete:** Confirm dialog → DELETE → redirect to list

### Key Fields for UI

| Display | Field | Notes |
|---------|-------|-------|
| Title | `title` | Primary display name |
| ID/Code | `number` | Standard reference number |
| Description | `description` | Full text, use in detail view |
| Status badge | `status` | 1=green/active, 0=red/inactive |
| State badge | `state` | draft/yellow, published/green, archived/gray |
| Parent link | `parentSlug` / `frameworkSlug` / `domainSlug` | Navigate to parent |
| Counts | `controlCount` / `domainsCount` | Show in cards/lists |
| Timestamps | `createdAt` / `updatedAt` | Show in detail view |
