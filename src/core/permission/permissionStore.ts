import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getCurrentUser } from '@/utils/cookie';

export interface PermissionState {
  user: Record<string, unknown> | null;
  roles: string[];
  permissions: string[];
  accessMatrix: Record<string, string[]>;
}

export const usePermissionStore = defineStore('permission', () => {
  const user = ref<Record<string, unknown> | null>(null);
  const roles = ref<string[]>([]);
  const permissions = ref<string[]>([]);
  const accessMatrix = ref<Record<string, string[]>>({});

  function init() {
    const currentUser = getCurrentUser();
    user.value = currentUser;
    if (currentUser?.roles) {
      roles.value = Array.isArray(currentUser.roles)
        ? currentUser.roles.map((r: { name?: string }) => r.name || r)
        : [];
    } else {
      roles.value = [];
    }
    if (currentUser?.permissions) {
      permissions.value = Array.isArray(currentUser.permissions)
        ? currentUser.permissions
        : [];
    } else {
      permissions.value = [];
    }
    if (currentUser?.accessMatrix) {
      accessMatrix.value = currentUser.accessMatrix as Record<string, string[]>;
    } else {
      accessMatrix.value = {};
    }
  }

  function setUser(u: Record<string, unknown> | null) {
    user.value = u;
    init();
  }

  return { user, roles, permissions, accessMatrix, init, setUser };
});
