# Risk State Transitions

## State Machine

```
DRAFT ──→ REGISTERED ──→ ANALYSIS ──→ RESPONSE ──→ MONITORING ──→ CLOSED ──→ ARCHIVED
              │                │                         │    │
              └──→ ARCHIVED    └──→ REGISTERED           │    └──→ ARCHIVED
                                                         └──→ ARCHIVED
                                                         └──→ RESPONSE (back)
```

## Valid Transitions

| From         | To           | Endpoint                           |
|--------------|--------------|------------------------------------|
| `draft`      | `registered` | `POST /grc/risks/:slug/registered` |
| `registered` | `analysis`   | `POST /grc/risks/:slug/analysis`   |
| `registered` | `archived`   | `POST /grc/risks/:slug/archive`    |
| `analysis`   | `response`   | `POST /grc/risks/:slug/response`   |
| `analysis`   | `registered` | `POST /grc/risks/:slug/registered` |
| `response`   | `monitoring` | `POST /grc/risks/:slug/monitoring` |
| `monitoring` | `closed`     | `POST /grc/risks/:slug/close`      |
| `monitoring` | `archived`   | `POST /grc/risks/:slug/archive`    |
| `monitoring` | `response`   | `POST /grc/risks/:slug/response`   |
| `closed`     | `archived`   | `POST /grc/risks/:slug/archive`    |
| `closed`     | `monitoring` | `POST /grc/risks/:slug/monitoring` |
| `archived`   | —            | terminal (no transitions)          |

## Required Params Per Transition

### draft → registered

| Field              | Type                    | Required | Description                              |
|--------------------|-------------------------|----------|------------------------------------------|
| `draftDescription` | string                  | yes      | Description for the draft state          |
| `title`            | string                  | yes      | Risk title                               |
| `riskType`         | `threat` \| `opportunity` | yes   | Risk type                                |
| `categorySlug`     | string                  | yes      | Category slug                            |
| `subCategorySlug`  | string                  | yes      | Sub-category slug                        |

### registered → analysis

| Field                 | Type                    | Required | Description                              |
|-----------------------|-------------------------|----------|------------------------------------------|
| `registerDescription` | string                  | yes      | Description for the registered state     |
| `title`               | string                  | yes      | Risk title                               |
| `riskType`            | `threat` \| `opportunity` | yes   | Risk type                                |
| `categorySlug`        | string                  | yes      | Category slug                            |
| `subCategorySlug`     | string                  | yes      | Sub-category slug                        |

### analysis → response

| Field                 | Type       | Required | Description                              |
|-----------------------|------------|----------|------------------------------------------|
| `analysisDescription` | string     | yes      | Description for the analysis state       |
| `impact`              | number 1-5 | yes      | Current impact                           |
| `likelihood`          | number 1-5 | yes      | Current likelihood                       |

**Auto-behavior:**
- `impact` → `inherentImpact` (if not already set)
- `likelihood` → `inherentLikelihood` (if not already set)
- `score` and `level` are auto-calculated

### response → monitoring

| Field                 | Type       | Required | Description                              |
|-----------------------|------------|----------|------------------------------------------|
| `responseDescription` | string     | yes      | Description for the response state       |
| `strategy`            | string     | yes      | Treatment strategy (`accept`, `mitigate`, `transfer`, `avoid`) |
| `frameworkSlug`       | string     | yes      | Framework slug                           |
| `domainSlug`          | string     | yes      | Domain slug                              |
| `controlSlug`         | string     | yes      | Control slug                             |
| `tasks`               | string[]   | yes      | At least one task title                  |

**Auto-behavior:** Each task string creates a `Task` entity linked to this risk.

### monitoring → closed

| Field                 | Type       | Required | Description                              |
|-----------------------|------------|----------|------------------------------------------|
| `monitoringDescription` | string   | yes      | Description for the monitoring state     |
| `residualImpact`      | number 1-5 | yes      | Residual impact after controls           |
| `residualLikelihood`  | number 1-5 | yes      | Residual likelihood after controls       |

### monitoring → archived

| Field                 | Type       | Required | Description                              |
|-----------------------|------------|----------|------------------------------------------|
| `monitoringDescription` | string   | yes      | Description for the monitoring state     |
| `impact`              | number 1-5 | yes      | Current impact                           |
| `likelihood`          | number 1-5 | yes      | Current likelihood                       |

**Auto-behavior:**
- `impact` → `residualImpact` (if not already set)
- `likelihood` → `residualLikelihood` (if not already set)
- Then `impact` is overwritten with `residualImpact`, `likelihood` with `residualLikelihood`
- `score` and `level` are re-calculated

### registered → archived

Only the state description is required:

| Field                 | Type   | Required | Description                              |
|-----------------------|--------|----------|------------------------------------------|
| `registerDescription` | string | yes      | Description for the registered state     |

### analysis → registered

Only the state description is required:

| Field                 | Type   | Required | Description                              |
|-----------------------|--------|----------|------------------------------------------|
| `analysisDescription` | string | yes      | Description for the analysis state       |

### monitoring → response

Only the state description is required:

| Field                 | Type   | Required | Description                              |
|-----------------------|--------|----------|------------------------------------------|
| `monitoringDescription` | string | yes    | Description for the monitoring state     |

### closed → archived

No fields required.

### closed → monitoring

No fields required.

## All Acceptable Body Fields

Every transition accepts any combination of these fields via `RiskTransitionDto`:

| Field               | Type       | Description                              |
|---------------------|------------|------------------------------------------|
| `comment`           | string     | Comment for the transition              |
| `title`             | string     | Risk title                               |
| `description`       | string     | Risk description                         |
| `createDescription` | string     | Create state description                 |
| `draftDescription`  | string     | Draft state description                  |
| `registerDescription` | string  | Registered state description             |
| `analysisDescription` | string  | Analysis state description               |
| `responseDescription` | string  | Response state description               |
| `monitoringDescription` | string | Monitoring state description             |
| `ownerId`           | string     | Owner user ID                            |
| `riskType`          | enum       | `threat` or `opportunity`                |
| `categorySlug`      | string     | Category slug                            |
| `categoryTitle`     | string     | Category title                           |
| `subCategorySlug`   | string     | Sub-category slug                        |
| `subCategoryTitle`  | string     | Sub-category title                       |
| `inherentImpact`    | number 1-5 | Inherent impact                          |
| `inherentLikelihood` | number 1-5 | Inherent likelihood                     |
| `impact`            | number 1-5 | Current impact                           |
| `likelihood`        | number 1-5 | Current likelihood                       |
| `score`             | number     | Current score (auto-calculated)          |
| `level`             | string     | Risk level (auto-calculated)             |
| `residualImpact`    | number 1-5 | Residual impact                          |
| `residualLikelihood` | number 1-5 | Residual likelihood                     |
| `strategy`          | string     | Treatment strategy                       |
| `treatmentStrategy` | string     | Treatment strategy (alias)               |
| `vulnerability`     | string     | Vulnerability description                |
| `threat`            | string     | Threat description                       |
| `frameworkSlug`     | string     | Framework slug                           |
| `frameworkTitle`    | string     | Framework title                          |
| `domainSlug`        | string     | Domain slug                              |
| `domainTitle`       | string     | Domain title                             |
| `controlSlug`       | string     | Control slug                             |
| `controlTitle`      | string     | Control title                            |
| `tasks`             | string[]   | Task titles (creates Task entities)      |
| `assigneeId`        | string     | Assignee user ID                         |
| `deadline`          | string     | Deadline date (ISO format)               |
| `updatedBy`         | number     | Updated by user ID                       |

## Error Responses

**Invalid transition:**
```json
{
  "result": false,
  "data": null,
  "error": ["RISK_TRANSITION.INVALID.DRAFT_TO_MONITORING"]
}
```

**Missing required fields:**
```json
{
  "result": false,
  "data": null,
  "error": [
    "RISK_TRANSITION.RESPONSE.IMPACT_REQUIRED",
    "RISK_TRANSITION.RESPONSE.LIKELIHOOD_REQUIRED",
    "RISK_TRANSITION.RESPONSE.RESPONSEDESCRIPTION_REQUIRED"
  ]
}
```
