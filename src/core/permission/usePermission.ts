import { usePermissionStore } from './permissionStore';

export function usePermission() {
  const store = usePermissionStore();

  function can(permissionKey: string): boolean {
    if (store.roles.includes('super-admin') || store.roles.includes('admin')) {
      return true;
    }
    return store.permissions.includes(permissionKey);
  }

  function hasRole(role: string): boolean {
    return store.roles.includes(role);
  }

  function canAccessRoute(routeName: string): boolean {
    return can(routeName) || store.roles.includes('super-admin') || store.roles.includes('admin');
  }

  function canShowMenu(menuKey: string): boolean {
    return can(menuKey) || store.roles.includes('super-admin') || store.roles.includes('admin');
  }

  return { can, hasRole, canAccessRoute, canShowMenu };
}
