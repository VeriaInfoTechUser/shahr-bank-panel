# Pages Structure Analysis

## Auth Pages

| Page | Route | Component |
|------|-------|-----------|
| Login | `/auth/login` | `pages/auth/login/index.vue` |

## App Pages

### Dashboard
| Page | Route | Component |
|------|-------|-----------|
| Dashboard | `/app/dashboard` | `pages/app/dashboard/index.vue` |

### Account
| Page | Route | Component |
|------|-------|-----------|
| Profile | `/app/account/profile` | `pages/app/account/profile/index.vue` |
| Password | `/app/account/password` | `pages/app/account/password/index.vue` |
| Edit | `/app/account/edit` | `pages/app/account/edit/index.vue` |
| History | `/app/account/history` | `pages/app/account/history/index.vue` |
| Notification | `/app/account/notification` | `pages/app/account/notification/index.vue` |

### Base Info
| Page | Route | Component |
|------|-------|-----------|
| Rules & Regulations | `/app/base-info/rules-regulations` | `pages/app/base-info/rules-regulations/index.vue` |
| Deleted Rules | `/app/base-info/rules-regulations/deleted` | `pages/app/base-info/rules-regulations/deleted.vue` |
| Tasks | `/app/base-info/tasks` | `pages/app/base-info/tasks/index.vue` |

### Compliance
| Page | Route | Component |
|------|-------|-----------|
| Dashboard | `/app/compliance/dashboard` | `pages/app/compliance/dashboard/index.vue` |
| Operations | `/app/compliance/operations` | `pages/app/compliance/operations/index.vue` |
| Doing Task | `/app/compliance/doing-task` | `pages/app/compliance/doing-task/index.vue` |
| Performance Report | `/app/compliance/performance-report` | `pages/app/compliance/performance-report/index.vue` |
| Report | `/app/compliance/report` | `pages/app/compliance/report/index.vue` |

### Risk
| Page | Route | Component |
|------|-------|-----------|
| Dashboard | `/app/risk/dashboard` | `pages/app/risk/dashboard/index.vue` |
| Operations | `/app/risk/operations` | `pages/app/risk/operations/index.vue` |
| Doing Task | `/app/risk/doing-task` | `pages/app/risk/doing-task/index.vue` |
| Performance Report | `/app/risk/performance-report` | `pages/app/risk/performance-report/index.vue` |
| Report | `/app/risk/report` | `pages/app/risk/report/index.vue` |

### ESG
| Page | Route | Component |
|------|-------|-----------|
| Dashboard | `/app/esg/dashboard` | `pages/app/esg/dashboard/index.vue` |
| Governance | `/app/esg/governance` | `pages/app/esg/governance/index.vue` |
| Social | `/app/esg/social` | `pages/app/esg/social/index.vue` |
| Environment | `/app/esg/environment` | `pages/app/esg/environment/index.vue` |
| Report | `/app/esg/report` | `pages/app/esg/report/index.vue` |

### Settings
| Page | Route | Component |
|------|-------|-----------|
| Guide | `/app/settings/guide` | `pages/app/settings/guide/index.vue` |
| Liaisons | `/app/settings/liaisons` | `pages/app/settings/liaisons/index.vue` |
| Legislative Authority | `/app/settings/legislative-authority` | `pages/app/settings/legislative-authority/index.vue` |
| Law Type | `/app/settings/law-type` | `pages/app/settings/law-type/index.vue` |

## Unregistered Pages (exist but not in router)

- `pages/app/blog/` — Blog module (create, detail, list)
- `pages/app/comment/` — Comment module (detail, list)
- `pages/app/management/` — Management meta/content
- `pages/app/order/` — Order module (create, detail, list)
- `pages/app/product/` — Product module (create, detail, list)
- `pages/app/request/` — Request module (detail, list)
- `pages/app/support/` — Support module (message, ticket)
- `pages/app/user/` — User list
