import {defineStore} from "pinia";
import {Icon} from "../base-components/Lucide/Lucide.vue";

export interface Menu {
    icon?: Icon;
    title: string;
    pageName?: string;
    subMenu?: Menu[];
    ignore?: boolean;
}

export interface SideMenuState {
    menu: Array<Menu | "divider">;
}

export const useSideMenuStore = defineStore("sideMenu", {
    state: (): SideMenuState => ({
        menu: [
            {
                icon: "Home",
                pageName: "app-dashboard",
                title: "menu.home",
                subMenu: [
                    {
                        icon: "LayoutDashboard",
                        pageName: "app-dashboard",
                        title: "menu.dashboard",
                    }
                ],
            },
            {
                icon: "Users",
                pageName: "app-user",
                title: "menu.users",
                subMenu: [
                    {
                        icon: "List",
                        pageName: "app-user-list",
                        title: "menu.list",
                    },
                ],
            },
            {
                icon: "Database",
                pageName: "app-base-info",
                title: "menu.base-info",
                subMenu: [
                    {
                        icon: "FileText",
                        pageName: "app-base-info-rules-regulations",
                        title: "menu.rules-regulations",
                    },
                    {
                        icon: "ClipboardList",
                        pageName: "app-base-info-tasks",
                        title: "menu.tasks",
                    },
                ],
            },
        ],
    }),
});
