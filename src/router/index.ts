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
import AppUserList from "@/pages/app/user/list/index.vue";
import BaseInfoRulesRegulations from "@/pages/app/base-info/rules-regulations/index.vue";
import BaseInfoDuties from "@/pages/app/base-info/duties/index.vue";
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
                        path: "user",
                        name: "app-user",
                        meta: { breadcrumbLabel: 'menu.users' },
                        children: [
                            {
                                path: "list",
                                name: "app-user-list",
                                component: AppUserList,
                                meta: { breadcrumbLabel: 'menu.list' },
                            },
                        ]
                    },
                    {
                        path: "base-info",
                        name: "app-base-info",
                        meta: { breadcrumbLabel: 'menu.base-info' },
                        children: [
                            {
                                path: "rules-regulations",
                                name: "app-base-info-rules-regulations",
                                component: BaseInfoRulesRegulations,
                                meta: { breadcrumbLabel: 'menu.rules-regulations' },
                            },
                            {
                                path: "duties",
                                name: "app-base-info-duties",
                                component: BaseInfoDuties,
                                meta: { breadcrumbLabel: 'menu.duties' },
                            },
                        ]
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
