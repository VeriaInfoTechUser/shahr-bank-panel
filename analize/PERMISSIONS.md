# Permission & RBAC Analysis

## Permission Store (`src/core/permission/permissionStore.ts`)

```typescript
interface PermissionState {
  user: Record<string, unknown> | null;
  roles: string[];
  permissions: string[];
  accessMatrix: Record<string, string[]>;
}
```

- `init()` — loads from cookie/user data
- `setUser(u)` — sets user and re-initializes

## usePermission Composable (`src/core/permission/usePermission.ts`)

| Method | Description |
|--------|-------------|
| `can(permissionKey)` | Check if user has permission (admin/super-admin bypass) |
| `hasRole(role)` | Check if user has specific role |
| `hasAnyRole(roles)` | Check if user has any of the given roles |
| `canAccessRoute(routeName)` | Check route access (permission or admin role) |
| `canShowMenu(menuKey)` | Check menu visibility |

## Route Guards (`src/router/index.ts`)

```typescript
meta: {
  requiresAuth: boolean;    // Redirects to /auth/login if not authenticated
  permission?: string;       // Checks canAccessRoute(permission)
  requiredRole?: string;     // Checks hasRole(requiredRole)
}
```

## Menu Visibility (`src/stores/side-menu.ts`)

Each menu item can have:
- `requiredRole?: string` — Only shown if user has this role
- `ignore?: boolean` — Hidden from menu

## Known Roles

| Role | Access |
|------|--------|
| `super-admin` | All permissions |
| `admin` | All permissions |
| `grc_admin` | Base Info, Settings (liaisons, legislative-authority, law-type) |
