import { usePermission } from './usePermission';

export interface MenuItem {
  title: string;
  icon?: string;
  permission?: string;
  route?: string;
  pageName?: string;
  subMenu?: MenuItem[];
}

export function useMenuBuilder(menuConfig: MenuItem[]) {
  const { canShowMenu } = usePermission();

  function filterByPermission(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => {
        if (!item.permission) return true;
        return canShowMenu(item.permission);
      })
      .map((item) => ({
        ...item,
        subMenu: item.subMenu ? filterByPermission(item.subMenu) : undefined,
      }))
      .filter((item) => !item.subMenu || item.subMenu.length > 0);
  }

  const filteredMenu = filterByPermission(menuConfig);

  return { filteredMenu };
}
