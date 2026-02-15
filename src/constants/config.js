export const base_url = 'http://localhost:8085/';

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
