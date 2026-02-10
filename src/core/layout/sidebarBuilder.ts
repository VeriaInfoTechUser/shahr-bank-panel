import type { MenuItem } from '../permission/menuBuilder';

export interface SidebarConfig {
  menu: MenuItem[];
  collapsed?: boolean;
}

export function buildSidebarItems(menu: MenuItem[]) {
  return menu.map((item) => ({
    ...item,
    hasChildren: item.subMenu && item.subMenu.length > 0,
  }));
}
