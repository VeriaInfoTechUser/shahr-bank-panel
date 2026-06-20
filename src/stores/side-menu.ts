import {defineStore} from "pinia";
import {Icon} from "../base-components/Lucide/Lucide.vue";

export interface Menu {
    icon?: Icon;
    title: string;
    pageName?: string;
    subMenu?: Menu[];
    ignore?: boolean;
    requiredRole?: string;
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
                requiredRole: "grc_admin",
                subMenu: [
                    // {
                    //     icon: "Scale",
                    //     pageName: "app-base-info-rules-regulations",
                    //     title: "menu.rules-regulations",
                    //     requiredRole: "grc_admin",
                    // },
                    // {
                    //     icon: "ClipboardCheck",
                    //     pageName: "app-base-info-tasks",
                    //     title: "menu.tasks",
                    //     requiredRole: "grc_admin",
                    // },
                    {
                        icon: "Layout",
                        pageName: "app-base-info-framework",
                        title: "menu.framework",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "Globe",
                        pageName: "app-base-info-domain",
                        title: "menu.domain",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "Shield",
                        pageName: "app-base-info-control",
                        title: "menu.control",
                        requiredRole: "grc_admin",
                    },
                ],
            },
            {
                icon: "ShieldCheck",
                pageName: "app-compliance",
                title: "menu.compliance",
                subMenu: [
                    // {
                    //     icon: "LayoutDashboard",
                    //     pageName: "app-compliance-dashboard",
                    //     title: "menu.dashboard",
                    // },
                    // {
                    //     icon: "ShieldCheck",
                    //     pageName: "app-compliance-operations",
                    //     title: "menu.compliance-operations",
                    // },
                    // {
                    //     icon: "BarChart3",
                    //     pageName: "app-compliance-performance-report",
                    //     title: "menu.performance-report",
                    // },
                    // {
                    //     icon: "FileText",
                    //     pageName: "app-compliance-report",
                    //     title: "menu.report",
                    // },
                    {
                        icon: "ClipboardList",
                        pageName: "app-compliance-plan",
                        title: "menu.plans",
                    },
                    {
                        icon: "ListChecks",
                        pageName: "app-compliance-task",
                        title: "menu.compliance-operations",
                    },
                ],
            },
            {
                icon: "AlertTriangle",
                pageName: "app-risk",
                title: "menu.risk",
                subMenu: [
                    // {
                    //     icon: "LayoutDashboard",
                    //     pageName: "app-risk-dashboard",
                    //     title: "menu.dashboard",
                    // },
                    {
                        icon: "Archive",
                        pageName: "app-risk-repository",
                        title: "menu.risk-repository",
                    },
                    {
                        icon: "List",
                        pageName: "app-risk-list",
                        title: "menu.risk-operations",
                    },
                    // {
                    //     icon: "BarChart3",
                    //     pageName: "app-risk-performance-report",
                    //     title: "menu.performance-report",
                    // },
                    // {
                    //     icon: "FileText",
                    //     pageName: "app-risk-report",
                    //     title: "menu.report",
                    // },
                    {
                        icon: "ArchiveRestore",
                        pageName: "app-risk-archive",
                        title: "menu.risk-archive",
                    },
                ],
            },
            {
                icon: "Globe",
                pageName: "app-esg",
                title: "menu.esg",
                subMenu: [
                    {
                        icon: "LayoutDashboard",
                        pageName: "app-esg-dashboard",
                        title: "menu.esg-dashboard",
                    },
                    {
                        icon: "ShieldCheck",
                        pageName: "app-esg-governance",
                        title: "menu.esg-governance",
                    },
                    {
                        icon: "Users",
                        pageName: "app-esg-social",
                        title: "menu.esg-social",
                    },
                    {
                        icon: "Leaf",
                        pageName: "app-esg-environment",
                        title: "menu.esg-environment",
                    },
                    {
                        icon: "BarChart3",
                        pageName: "app-esg-report",
                        title: "menu.esg-report",
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
                        icon: "Users",
                        pageName: "app-settings-liaisons",
                        title: "menu.settings-liaisons",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "Landmark",
                        pageName: "app-settings-legislative-authority",
                        title: "menu.settings-legislative-authority",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "FileType",
                        pageName: "app-settings-law-type",
                        title: "menu.settings-law-type",
                        requiredRole: "grc_admin",
                    },
                ],
            },
        ],
    }),
});
