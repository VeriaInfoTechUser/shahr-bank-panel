# Context Module — Controller Documentation

## Overview

The Context module provides CRUD endpoints for 5 entity types within the `referential` table. Each entity uses a dedicated `type` value and the `context` source, with JSONB `information` for entity-specific fields.

| Entity | Route Prefix | Type | Slug Param |
|--------|-------------|------|------------|
| Capital | `context/capitals` | `capital` | `:slug` |
| Component | `context/components` | `component` | `:slug` |
| Capability | `context/capabilities` | `capability` | `:slug` |
| Claim | `context/claims` | `claim` | `:slug` |
| Indicator | `context/indicators` | `indicator` | `:slug` |

---

## Endpoints per Entity

| Method | Route | Description | Request Body |
|--------|-------|-------------|-------------|
| `POST` | `/<entity>` | Create a new record | `Create<Entity>Dto` |
| `GET` | `/<entity>` | List records (paginated) | Query: `List<Entity>Dto` |
| `GET` | `/<entity>/:slug` | Get one by slug | — |
| `PUT` | `/<entity>/:slug` | Update by slug | `Update<Entity>Dto` |
| `DELETE` | `/<entity>/:slug` | Delete by slug | — |
| `GET` | `/<entity>/tree` | Get as hierarchical tree | Query: `List<Entity>Dto` (capital only) |

All responses follow the standard wrapper: `{ result: boolean, data: T | null, error: string[] }`.

---

## API Endpoints

### Capitals

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/context/capitals` | Create a capital |
| `GET` | `/api/v1/context/capitals` | List capitals (paginated) |
| `GET` | `/api/v1/context/capitals/tree` | Get capitals as tree (slug → parentSlug) |
| `GET` | `/api/v1/context/capitals/:slug` | Get capital by slug |
| `PUT` | `/api/v1/context/capitals/:slug` | Update a capital |
| `DELETE` | `/api/v1/context/capitals/:slug` | Delete a capital |

### Components

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/context/components` | Create a component |
| `GET` | `/api/v1/context/components` | List components (paginated) |
| `GET` | `/api/v1/context/components/:slug` | Get component by slug |
| `PUT` | `/api/v1/context/components/:slug` | Update a component |
| `DELETE` | `/api/v1/context/components/:slug` | Delete a component |

### Capabilities

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/context/capabilities` | Create a capability |
| `GET` | `/api/v1/context/capabilities` | List capabilities (paginated) |
| `GET` | `/api/v1/context/capabilities/:slug` | Get capability by slug |
| `PUT` | `/api/v1/context/capabilities/:slug` | Update a capability |
| `DELETE` | `/api/v1/context/capabilities/:slug` | Delete a capability |

### Claims

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/context/claims` | Create a claim |
| `GET` | `/api/v1/context/claims` | List claims (paginated) |
| `GET` | `/api/v1/context/claims/:slug` | Get claim by slug |
| `PUT` | `/api/v1/context/claims/:slug` | Update a claim |
| `DELETE` | `/api/v1/context/claims/:slug` | Delete a claim |

### Indicators

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/context/indicators` | Create an indicator |
| `GET` | `/api/v1/context/indicators` | List indicators (paginated) |
| `GET` | `/api/v1/context/indicators/:slug` | Get indicator by slug |
| `PUT` | `/api/v1/context/indicators/:slug` | Update an indicator |
| `DELETE` | `/api/v1/context/indicators/:slug` | Delete an indicator |

---

## DTO Reference

### Create DTO (Common Fields)

All create DTOs share the same structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | Yes | Unique identifier (max 255 chars) |
| `status` | `number` | Yes | 1=active, 0=inactive |
| `state` | `string` | No | Lifecycle state (e.g. "draft") |
| `parentSlug` | `string` | No | Parent entity slug |
| `tenantId` | `number` | No | Tenant ID |
| `title` | `string` | No | Display name |
| `number` | `string` | No | Reference number |
| `summary` | `string` | No | Brief description |
| `version` | `string` | No | Version string |
| `description` | `string` | No | Detailed description |
| `frameworkSlug` | `string` | No | Associated framework slug |
| `domainSlug` | `string` | No | Associated domain slug (component, capability, claim, indicator only) |
| `createdBy` | `number` | No | Creator user ID |

### Update DTO

Same fields as Create, but all optional. Only provided fields are updated.

### List DTO (Query Parameters)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page |
| `level` | `number` | `4` | Tree depth level (capital tree endpoint only) |
| `status` | `number` | — | Filter by status |
| `title` | `string` | — | Filter by title (contains, case-insensitive) |
| `frameworkSlug` | `string[]` | — | Filter by framework slug(s) |
| `domainSlug` | `string[]` | — | Filter by domain slug(s) |

### Response DTO

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Auto-generated ID |
| `slug` | `string` | Unique slug |
| `type` | `string` | Entity type |
| `source` | `string` | Always `"context"` |
| `status` | `number` | 1=active, 0=inactive |
| `state` | `string` | Lifecycle state |
| `parentSlug` | `string` | Parent entity slug |
| `tenantId` | `number` | Tenant ID |
| `title` | `string` | Display name |
| `number` | `string` | Reference number |
| `summary` | `string` | Brief description |
| `version` | `string` | Version string |
| `description` | `string` | Detailed description |
| `frameworkSlug` | `string` | Associated framework slug |
| `frameworkTitle` | `string` | Resolved framework title |
| `domainSlug` | `string` | Associated domain slug |
| `domainTitle` | `string` | Resolved domain title |
| `createdBy` | `number` | Creator user ID |
| `updatedBy` | `number` | Last updater user ID |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |

---

## Tree Endpoint (Capital)

### `GET /api/v1/context/capitals/tree`

Returns all capitals organized as a hierarchical tree based on `slug → parentSlug` relationships.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | `number` | `4` | Max tree depth (1 = roots only, 2 = roots + children, etc.) |
| `status` | `number` | — | Filter by status |
| `title` | `string` | — | Filter by title |
| `frameworkSlug` | `string[]` | — | Filter by framework slug(s) |

**Response Structure:**

```json
{
  "result": true,
  "data": [
    {
      "id": 1,
      "slug": "financial-capital",
      "title": "Financial Capital",
      "parentSlug": null,
      "children": [
        {
          "id": 2,
          "slug": "liquid-assets",
          "title": "Liquid Assets",
          "parentSlug": "financial-capital",
          "children": []
        }
      ]
    }
  ],
  "error": []
}
```

**Tree Building Logic:**
- Fetches all capitals matching filters (up to 10,000 records)
- Maps items by `slug`, links children to parents via `parentSlug`
- Items with no `parentSlug` become root nodes
- Uses `ReferentialService.buildTree()` for assembly
- Trims tree depth to `level` parameter (default 4) — nodes beyond the limit are dropped

**Depth Examples:**

| `level` | Behavior |
|---------|----------|
| `1` | Root nodes only (no children) |
| `2` | Roots + direct children |
| `3` | Roots + children + grandchildren |
| `4` | 4 levels deep (default) |
| `5+` | Deeper nesting

---

## Example Requests

### Create a Capital

```http
POST /api/v1/context/capitals
Content-Type: application/json

{
  "slug": "human-capital",
  "status": 1,
  "title": "Human Capital",
  "number": "HC",
  "summary": "People and organizational skills",
  "frameworkSlug": "iso-27001"
}
```

### Get Capital Tree (default 4 levels)

```http
GET /api/v1/context/capitals/tree
```

### Get Capital Tree — 2 levels only

```http
GET /api/v1/context/capitals/tree?level=2
```

### Get Capital Tree with Filters

```http
GET /api/v1/context/capitals/tree?frameworkSlug=iso-27001&status=1&level=3
```

### List Components with Filters

```http
GET /api/v1/context/components?page=1&limit=10&frameworkSlug=iso-27001&domainSlug=data-security&title=firewall
```

### Update a Capability

```http
PUT /api/v1/context/capabilities/incident-response
Content-Type: application/json

{
  "title": "Incident Response Updated",
  "description": "Updated capability covering incident detection and response procedures",
  "status": 1
}
```

### Delete an Indicator

```http
DELETE /api/v1/context/indicators/uptime-sla
```

---

## Architecture

- **Base entity**: All entities stored in the `referential` table using the `ReferentialEntity` model
- **JSONB field**: Entity-specific fields (`title`, `number`, `summary`, etc.) stored in the `information` JSONB column
- **Service pattern**: Each service uses `ReferentialService` with `splitDto()` to separate entity-level fields from information fields
- **Filter pattern**: Each entity has a `FilterBuilder` extending `BaseFilterBuilder` for declarative filter definitions
- **Controller pattern**: One controller class per endpoint (handler-per-endpoint), using `ApiResponseHelper` for uniform responses
- **Tree pattern**: Capital entity supports hierarchical tree view via `slug → parentSlug` relationships using `ReferentialService.buildTree()`

### File Structure

```
src/modules/context/
├── controller/
│   ├── capital/
│   │   ├── create-capital.controller.ts
│   │   ├── list-capital.controller.ts
│   │   ├── get-capital.controller.ts
│   │   ├── update-capital.controller.ts
│   │   ├── delete-capital.controller.ts
│   │   └── tree-capital.controller.ts
│   ├── component/
│   │   ├── create-component.controller.ts
│   │   ├── list-component.controller.ts
│   │   ├── get-component.controller.ts
│   │   ├── update-component.controller.ts
│   │   └── delete-component.controller.ts
│   ├── capability/
│   │   ├── create-capability.controller.ts
│   │   ├── list-capability.controller.ts
│   │   ├── get-capability.controller.ts
│   │   ├── update-capability.controller.ts
│   │   └── delete-capability.controller.ts
│   ├── claim/
│   │   ├── create-claim.controller.ts
│   │   ├── list-claim.controller.ts
│   │   ├── get-claim.controller.ts
│   │   ├── update-claim.controller.ts
│   │   └── delete-claim.controller.ts
│   └── indicator/
│       ├── create-indicator.controller.ts
│       ├── list-indicator.controller.ts
│       ├── get-indicator.controller.ts
│       ├── update-indicator.controller.ts
│       └── delete-indicator.controller.ts
├── dto/
│   ├── capital/
│   │   ├── request/
│   │   │   ├── create-capital.dto.ts
│   │   │   ├── list-capital.dto.ts
│   │   │   ├── get-capital.dto.ts
│   │   │   └── update-capital.dto.ts
│   │   └── response/
│   │       └── capital-response.dto.ts
│   ├── component/
│   │   ├── request/
│   │   │   ├── create-component.dto.ts
│   │   │   ├── list-component.dto.ts
│   │   │   ├── get-component.dto.ts
│   │   │   └── update-component.dto.ts
│   │   └── response/
│   │       └── component-response.dto.ts
│   ├── capability/
│   │   ├── request/
│   │   │   ├── create-capability.dto.ts
│   │   │   ├── list-capability.dto.ts
│   │   │   ├── get-capability.dto.ts
│   │   │   └── update-capability.dto.ts
│   │   └── response/
│   │       └── capability-response.dto.ts
│   ├── claim/
│   │   ├── request/
│   │   │   ├── create-claim.dto.ts
│   │   │   ├── list-claim.dto.ts
│   │   │   ├── get-claim.dto.ts
│   │   │   └── update-claim.dto.ts
│   │   └── response/
│   │       └── claim-response.dto.ts
│   └── indicator/
│       ├── request/
│       │   ├── create-indicator.dto.ts
│       │   ├── list-indicator.dto.ts
│       │   ├── get-indicator.dto.ts
│       │   └── update-indicator.dto.ts
│       └── response/
│           └── indicator-response.dto.ts
├── service/
│   ├── capital/capital.service.ts
│   ├── component/component.service.ts
│   ├── capability/capability.service.ts
│   ├── claim/claim.service.ts
│   └── indicator/indicator.service.ts
└── filter/
    ├── capital-filter.builder.ts
    ├── component-filter.builder.ts
    ├── capability-filter.builder.ts
    ├── claim-filter.builder.ts
    └── indicator-filter.builder.ts
```
