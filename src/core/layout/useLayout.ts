import { ref } from 'vue';

export function useLayout() {
  const sidebarCollapsed = ref(false);
  const sidebarVisible = ref(true);

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function toggleSidebarVisibility() {
    sidebarVisible.value = !sidebarVisible.value;
  }

  return { sidebarCollapsed, sidebarVisible, toggleSidebar, toggleSidebarVisibility };
}
