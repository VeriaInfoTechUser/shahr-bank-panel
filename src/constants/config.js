/**
 * API base URLs — driven by environment variables (see .env.example).
 * These are baked into the bundle at build time by Vite.
 */
export const base_url = import.meta.env.VITE_BASE_URL || 'https://rastak-oauth.webx.ir/';
export const grc_base_url = import.meta.env.VITE_GRC_BASE_URL || 'http://localhost:3000/api/v1/';

export const setting = {
  wallet: {
    isActive: false
  }
};

export const uri = {
  api: {
    user: {
      logout: "user/authentication/logout",
      login: "user/authentication/login",
      password: {
        update: "user/password/update",
        add: "user/password/add",
      },
      profile: {
        view: 'user/profile/view',
        update: 'user/profile/update',
        history: 'user/profile/history',
      },
    },
    notification: {
      count: "notification/count",
      list: "notification/list"
    },
    media: {
      private: {
        stream: "media/private/stream",
      },
    },
  },
  admin: {
    user: {
      profile: {
        list: 'admin/user/profile/list',
        status: 'admin/user/profile/status',
        delete: 'admin/user/profile/delete',
        edit: 'admin/user/profile/edit',
        add: 'admin/user/profile/add',
        password: 'admin/user/profile/password',
      },
      role: {
        list: 'admin/user/role/list',
      },
    },
    logger: {
      history: {
        list: 'admin/logger/history/list',
      },
    },
    erm: {
      rule: {
        list: 'erm/rule/list',
      },
    },
  },
};

export const cookieDomain = "/";
export const defaultLocale = 'fa';
export const defaultDirection = 'rtl';
export const localeOptions = [
  { id: 'en', name: 'English', direction: 'ltr' },
  { id: 'fa', name: 'فارسی', direction: 'rtl' },
];
