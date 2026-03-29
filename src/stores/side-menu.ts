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
            {
                icon: "ShieldCheck",
                pageName: "app-compliance",
                title: "menu.compliance",
                subMenu: [
                    {
                        icon: "LayoutDashboard",
                        pageName: "app-compliance-dashboard",
                        title: "menu.dashboard",
                    },
                    {
                        icon: "GitBranch",
                        pageName: "app-compliance-operations",
                        title: "menu.compliance-operations",
                    },
                    {
                        icon: "BarChart3",
                        pageName: "app-compliance-performance-report",
                        title: "menu.performance-report",
                    },
                ],
            },
            {
                icon: "AlertTriangle",
                pageName: "app-risk",
                title: "menu.risk",
                subMenu: [
                    {
                        icon: "LayoutDashboard",
                        pageName: "app-risk-dashboard",
                        title: "menu.dashboard",
                    },
                    {
                        icon: "GitBranch",
                        pageName: "app-risk-operations",
                        title: "menu.risk-operations",
                    },
                    {
                        icon: "BarChart3",
                        pageName: "app-risk-performance-report",
                        title: "menu.performance-report",
                    },
                ],
            },
            {
                icon: "Settings",
                pageName: "app-settings",
                title: "menu.settings",
                subMenu: [
                    {
                        icon: "BookOpen",
                        pageName: "app-settings-guide",
                        title: "menu.settings-guide",
                    },
                    {
                        icon: "Link2",
                        pageName: "app-settings-liaisons",
                        title: "menu.settings-liaisons",
                    },
                    {
                        icon: "Landmark",
                        pageName: "app-settings-legislative-authority",
                        title: "menu.settings-legislative-authority",
                    },
                    {
                        icon: "FileType",
                        pageName: "app-settings-law-type",
                        title: "menu.settings-law-type",
                    },
                ],
            },
        ],
    }),
});
