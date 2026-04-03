import { createRouter, createWebHistory } from "vue-router";
import SideMenu from "@/layouts/SideMenu/SideMenu.vue";
import { setCurrentUser, getCurrentUser, getCookie } from '../utils/cookie';
import { usePermissionStore } from '@/core/permission/permissionStore';
import { usePermission } from '@/core/permission/usePermission';

import Dashboard from "@/pages/app/dashboard/index.vue";
import AppAccount from "@/pages/app/account/index.vue";
import AppAccountProfile from "@/pages/app/account/profile/index.vue";
import AppAccountPassword from "@/pages/app/account/password/index.vue";
import AppAccountEdit from "@/pages/app/account/edit/index.vue";
import AppAccountHistory from "@/pages/app/account/history/index.vue";
import AppAccountNotification from "@/pages/app/account/notification/index.vue";
import BaseInfoRulesRegulations from "@/pages/app/base-info/rules-regulations/index.vue";
import BaseInfoRulesRegulationsDeleted from "@/pages/app/base-info/rules-regulations/deleted.vue";
import BaseInfoTasks from "@/pages/app/base-info/tasks/index.vue";
import SettingsGuide from "@/pages/app/settings/guide/index.vue";
import SettingsLiaisons from "@/pages/app/settings/liaisons/index.vue";
import SettingsLegislativeAuthority from "@/pages/app/settings/legislative-authority/index.vue";
import SettingsLawType from "@/pages/app/settings/law-type/index.vue";
import ComplianceOperations from "@/pages/app/compliance/operations/index.vue";
import ComplianceDoingTask from "@/pages/app/compliance/doing-task/index.vue";
import RiskOperations from "@/pages/app/risk/operations/index.vue";
import SectionPlaceholderPage from "@/pages/app/shared/SectionPlaceholderPage.vue";
import AuthLogin from "@/pages/auth/login/index.vue";

const routes = [
    {
        path: "/",
        redirect: "/app/dashboard",
        children: [
            {
                path: "auth",
                meta: {requiresAuth: false},
                children: [
                    {
                        path: "login",
                        name: "auth-login",
                        component: AuthLogin,
                    }
                ]
            },
            {
                path: "app",
                component: SideMenu,
                meta: {requiresAuth: true},
                children: [
                    {
                        path: "dashboard",
                        name: "app-dashboard",
                        component: Dashboard,
                        meta: { breadcrumbLabel: 'menu.dashboard' },
                    },
                    {
                        path: "account",
                        name: "app-account",
                        component: AppAccount,
                        meta: { breadcrumbLabel: 'menu.profile' },
                        children: [
                            {
                                path: "profile",
                                name: "app-account-profile",
                                component: AppAccountProfile,
                                meta: { breadcrumbLabel: 'menu.profile' },
                            },
                            {
                                path: "password",
                                name: "app-account-password",
                                component: AppAccountPassword,
                                meta: { breadcrumbLabel: 'title.new-password' },
                            },
                            {
                                path: "edit",
                                name: "app-account-edit",
                                component: AppAccountEdit,
                                meta: { breadcrumbLabel: 'title.update' },
                            },
                            {
                                path: "history",
                                name: "app-account-history",
                                component: AppAccountHistory,
                                meta: { breadcrumbLabel: 'title.history' },
                            },
                            {
                                path: "notification",
                                name: "app-account-notification",
                                component: AppAccountNotification,
                                meta: { breadcrumbLabel: 'title.notification' },
                            },
                        ]
                    },
                    {
                        path: "base-info",
                        name: "app-base-info",
                        meta: { breadcrumbLabel: 'menu.base-info' },
                        children: [
                            {
                                path: "rules-regulations/deleted",
                                name: "app-base-info-rules-regulations-deleted",
                                component: BaseInfoRulesRegulationsDeleted,
                                meta: { breadcrumbLabel: 'menu.rules-regulations-deleted' },
                            },
                            {
                                path: "rules-regulations",
                                name: "app-base-info-rules-regulations",
                                component: BaseInfoRulesRegulations,
                                meta: { breadcrumbLabel: 'menu.rules-regulations' },
                            },
                            {
                                path: "tasks",
                                name: "app-base-info-tasks",
                                component: BaseInfoTasks,
                                meta: { breadcrumbLabel: 'menu.tasks' },
                            },
                        ]
                    },
                    {
                        path: "settings",
                        name: "app-settings",
                        redirect: { name: "app-settings-guide" },
                        meta: { breadcrumbLabel: 'menu.settings' },
                        children: [
                            {
                                path: "guide",
                                name: "app-settings-guide",
                                component: SettingsGuide,
                                meta: { breadcrumbLabel: 'menu.settings-guide' },
                            },
                            {
                                path: "liaisons",
                                name: "app-settings-liaisons",
                                component: SettingsLiaisons,
                                meta: { breadcrumbLabel: 'menu.settings-liaisons' },
                            },
                            {
                                path: "legislative-authority",
                                name: "app-settings-legislative-authority",
                                component: SettingsLegislativeAuthority,
                                meta: { breadcrumbLabel: 'menu.settings-legislative-authority' },
                            },
                            {
                                path: "law-type",
                                name: "app-settings-law-type",
                                component: SettingsLawType,
                                meta: { breadcrumbLabel: 'menu.settings-law-type' },
                            },
                        ],
                    },
                    {
                        path: "compliance",
                        name: "app-compliance",
                        redirect: { name: "app-compliance-dashboard" },
                        meta: { breadcrumbLabel: 'menu.compliance' },
                        children: [
                            {
                                path: "dashboard",
                                name: "app-compliance-dashboard",
                                component: SectionPlaceholderPage,
                                meta: { breadcrumbLabel: 'menu.dashboard' },
                            },
                            {
                                path: "operations",
                                name: "app-compliance-operations",
                                component: ComplianceOperations,
                                meta: { breadcrumbLabel: 'menu.compliance-operations' },
                            },
                            {
                                path: "doing-task",
                                name: "app-compliance-doing-task",
                                component: ComplianceDoingTask,
                                meta: { breadcrumbLabel: 'menu.compliance-doing-task' },
                            },
                            {
                                path: "performance-report",
                                name: "app-compliance-performance-report",
                                component: SectionPlaceholderPage,
                                meta: { breadcrumbLabel: 'menu.performance-report' },
                            },
                        ],
                    },
                    {
                        path: "risk",
                        name: "app-risk",
                        redirect: { name: "app-risk-dashboard" },
                        meta: { breadcrumbLabel: 'menu.risk' },
                        children: [
                            {
                                path: "dashboard",
                                name: "app-risk-dashboard",
                                component: SectionPlaceholderPage,
                                meta: { breadcrumbLabel: 'menu.dashboard' },
                            },
                            {
                                path: "operations",
                                name: "app-risk-operations",
                                component: RiskOperations,
                                meta: { breadcrumbLabel: 'menu.risk-operations' },
                            },
                            {
                                path: "performance-report",
                                name: "app-risk-performance-report",
                                component: SectionPlaceholderPage,
                                meta: { breadcrumbLabel: 'menu.performance-report' },
                            },
                        ],
                    },
                ]
            },

        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return savedPosition || {left: 0, top: 0};
    },
});

router.beforeEach((to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        const utn = getCookie('utn');
        const user = getCurrentUser();
        if (utn && user) {
            const permStore = usePermissionStore();
            permStore.init();
            const permission = to.meta.permission as string | undefined;
            if (permission) {
                const { canAccessRoute } = usePermission();
                if (canAccessRoute(permission)) {
                    next();
                } else {
                    next({ name: 'app-dashboard' });
                }
            } else {
                next();
            }
        } else {
            setCurrentUser(null);
            next({
                path: '/auth/login',
                query: { redirect: to.fullPath },
            });
        }
    } else {
        next();
    }
});

export default router;
