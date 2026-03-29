export const endpoints = {
  auth: {
    login: 'user/authentication/login',
    logout: 'user/authentication/logout',
  },
  user: {
    profile: {
      view: 'user/profile/view',
      update: 'user/profile/update',
      history: 'user/profile/history',
    },
    password: {
      update: 'user/password/update',
      add: 'user/password/add',
    },
    avatar: {
      upload: 'user/avatar/upload',
    },
  },
  notification: {
    count: 'notification/count',
    list: 'notification/list',
  },
  media: {
    private: {
      stream: 'media/private/stream',
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
      task: {
        list: 'erm/task/list',
      },
      compliance: {
        list: 'erm/compliance/list',
      },
      member: {
        list: 'erm/member/list',
      },
      ruleAuthor: {
        list: 'erm/rule/author/list',
      },
      ruleType: {
        list: 'erm/rule/type/list',
      },
    },
  },
};
