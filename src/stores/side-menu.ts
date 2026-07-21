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
                    {
                        icon: "LayoutDashboard",
                        pageName: "app-compliance-dashboard",
                        title: "menu.dashboard",
                    },
                    // {
                    //     icon: "ShieldCheck",
                    //     pageName: "app-compliance-operations",
                    //     title: "menu.compliance-operations",
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
                    {
                        icon: "FileText",
                        pageName: "app-compliance-report",
                        title: "menu.report",
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
                        icon: "Archive",
                        pageName: "app-risk-repository",
                        title: "menu.risk-repository",
                    },
                    {
                        icon: "List",
                        pageName: "app-risk-list",
                        title: "menu.risk-operations",
                    },
                    {
                        icon: "ArchiveRestore",
                        pageName: "app-risk-archive",
                        title: "menu.risk-archive",
                    },
                    {
                        icon: "ClipboardList",
                        pageName: "app-risk-task",
                        title: "menu.risk-task",
                    },
                    {
                        icon: "FileText",
                        pageName: "app-risk-report",
                        title: "menu.report",
                    },
                ],
            },
            {
                icon: "Shield",
                pageName: "app-governance",
                title: "menu.organization-profile",
                subMenu: [
                    {
                        icon: "Landmark",
                        pageName: "app-governance-legislative-authority",
                        title: "menu.governance-legislative-authority",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "FileType",
                        pageName: "app-governance-law-type",
                        title: "menu.governance-law-type",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "MapPin",
                        pageName: "app-governance-geographic-regions",
                        title: "menu.governance-geographic-regions",
                    },
                    {
                        icon: "Factory",
                        pageName: "app-governance-industry",
                        title: "menu.governance-industry",
                    },
                    {
                        icon: "UserCheck",
                        pageName: "app-governance-key-stakeholders",
                        title: "menu.governance-key-stakeholders",
                    },
                    {
                        icon: "Building",
                        pageName: "app-governance-operational-units",
                        title: "menu.governance-operational-units",
                    },
                    {
                        icon: "Maximize",
                        pageName: "app-governance-organization-size",
                        title: "menu.governance-organization-size",
                    },
                    {
                        icon: "Network",
                        pageName: "app-governance-organizational-structure",
                        title: "menu.governance-organizational-structure",
                    },
                    {
                        icon: "Package",
                        pageName: "app-governance-products-services",
                        title: "menu.governance-products-services",
                    },
                    {
                        icon: "FileText",
                        pageName: "app-governance-reporting-boundary",
                        title: "menu.governance-reporting-boundary",
                    },
                    {
                        icon: "GitBranch",
                        pageName: "app-governance-subsidiaries",
                        title: "menu.governance-subsidiaries",
                    },
                    {
                        icon: "Link",
                        pageName: "app-governance-value-chain",
                        title: "menu.governance-value-chain",
                    },
                    {
                        icon: "Users",
                        pageName: "app-governance-liaisons",
                        title: "menu.governance-liaisons",
                        requiredRole: "grc_admin",
                    },
                    {
                        icon: "BookOpen",
                        pageName: "app-governance-guide",
                        title: "menu.governance-guide",
                    },
                ],
            },
            {
                icon: "Leaf",
                pageName: "app-sustainability",
                title: "menu.sustainability",
                subMenu: [
                    {
                        icon: "Network",
                        pageName: "app-sustainability-fundamental-capitals",
                        title: "menu.sustainability-fundamental-capitals",
                    },
                    {
                        icon: "FileCheck",
                        pageName: "app-sustainability-claim",
                        title: "menu.sustainability-claim",
                    },
                    {
                        icon: "BarChart3",
                        pageName: "app-sustainability-indicator",
                        title: "menu.sustainability-indicator",
                    },
                    {
                        icon: "Briefcase",
                        pageName: "app-sustainability-asset",
                        title: "menu.sustainability-asset",
                    },
                    {
                        icon: "GitBranch",
                        pageName: "app-sustainability-graph",
                        title: "menu.sustainability-graph",
                    },
                ],
            },
            {
                icon: "Database",
                pageName: "app-data",
                title: "menu.data",
                subMenu: [
                    {
                        icon: "FileText",
                        pageName: "app-data-raw",
                        title: "menu.data-raw",
                    },
                    {
                        icon: "Upload",
                        pageName: "app-data-entry",
                        title: "menu.data-entry",
                    },
                    {
                        icon: "Zap",
                        pageName: "app-data-executive-process",
                        title: "menu.data-executive-process",
                    },
                    {
                        icon: "Settings",
                        pageName: "app-data-processing",
                        title: "menu.data-processing-primary",
                    },
                    {
                        icon: "Settings",
                        pageName: "app-data-processing-secondary",
                        title: "menu.data-processing-secondary",
                    },
                    {
                        icon: "FileText",
                        pageName: "app-data-log",
                        title: "menu.data-log",
                    },
                ],
            },

            {
                icon: "FileBarChart",
                pageName: "app-reports",
                title: "menu.reports",
                subMenu: [
                    {
                        icon: "FileText",
                        pageName: "app-reports-baseline",
                        title: "menu.reports-baseline",
                    },
                    {
                        icon: "GitCompare",
                        pageName: "app-reports-comparative",
                        title: "menu.reports-comparative",
                    },
                ],
            },
            {
                icon: "BookOpen",
                pageName: "app-knowledge",
                title: "menu.knowledge",
                subMenu: [
                    {
                        icon: "Files",
                        pageName: "app-knowledge-documents",
                        title: "menu.knowledge-documents",
                    },
                    {
                        icon: "Sparkles",
                        pageName: "app-knowledge-semantic-search",
                        title: "menu.knowledge-semantic-search",
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
        ],
    }),
});
