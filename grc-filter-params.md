# Add filter query parameters to GRC list endpoints

## Description

The frontend now sends filter query parameters to these three GET endpoints. Please update each endpoint to accept and apply these filters:

---

## 1. `GET /grc/frameworks`

| Param   | Type   | Required | Description                                                            |
| ------- | ------ | -------- | ---------------------------------------------------------------------- |
| `title` | string | No       | Filter frameworks where `title` contains this value (case-insensitive) |

---

## 2. `GET /grc/domains`

| Param           | Type   | Required | Description                                                          |
| --------------- | ------ | -------- | -------------------------------------------------------------------- |
| `title`         | string | No       | Filter domains where `title` contains this value (case-insensitive)  |
| `frameworkSlug` | string | No       | Filter domains belonging to this framework (exact match)             |

---

## 3. `GET /grc/controls`

| Param           | Type   | Required | Description                                                          |
| --------------- | ------ | -------- | -------------------------------------------------------------------- |
| `title`         | string | No       | Filter controls where `title` contains this value (case-insensitive) |
| `frameworkSlug` | string | No       | Filter controls belonging to this framework (exact match)            |
| `domainSlug`    | string | No       | Filter controls belonging to this domain (exact match)               |

---

## Behavior

- All filter params are optional. If omitted, return all records (respecting existing `page`/`limit`/`status` params).
- Multiple filters should be combined with **AND** logic.
- `title` filter should use `LIKE %value%` (case-insensitive).
- `frameworkSlug` and `domainSlug` are exact string matches.
- The `paginator.count` in the response must reflect the total count **after** filtering, not before.

---

## Example requests

```
GET /grc/frameworks?page=1&limit=10&title=iso
```

```
GET /grc/domains?page=1&limit=10&frameworkSlug=iso-27001
```

```
GET /grc/controls?page=1&limit=10&frameworkSlug=iso-27001&domainSlug=data-security
```
