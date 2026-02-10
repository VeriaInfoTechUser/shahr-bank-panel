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
                    },
                    {
                        path: "account",
                        name: "app-account",
                        component: AppAccount,
                        children: [
                            {
                                path: "profile",
                                name: "app-account-profile",
                                component: AppAccountProfile,
                            },
                            {
                                path: "password",
                                name: "app-account-password",
                                component: AppAccountPassword,
                            },
                            {
                                path: "edit",
                                name: "app-account-edit",
                                component: AppAccountEdit,
                            },
                            {
                                path: "history",
                                name: "app-account-history",
                                component: AppAccountHistory,
                            },
                            {
                                path: "notification",
                                name: "app-account-notification",
                                component: AppAccountNotification,
                            },
                        ]
                    },
                    {
                        path: "user",
                        name: "app-user",
                        children: [
                            {
                                path: "list",
                                name: "app-user-list",
                                component: AppUserList,
                            },
                        ]
                    },
                    {
                        path: "base-info",
                        name: "app-base-info",
                        children: [
                            {
                                path: "rules-regulations",
                                name: "app-base-info-rules-regulations",
                                component: BaseInfoRulesRegulations,
                            },
                            {
                                path: "duties",
                                name: "app-base-info-duties",
                                component: BaseInfoDuties,
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
