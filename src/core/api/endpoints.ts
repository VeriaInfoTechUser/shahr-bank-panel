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
        lightList: 'erm/rule/light-list',
        add: 'erm/rule/add',
        edit: 'erm/rule/edit',
        delete: 'erm/rule/delete',
      },
      ruleCategory: {
        list: 'erm/rule/category/list',
      },
      task: {
        list: 'erm/task/list',
        get: 'erm/task/get',
        add: 'erm/task/add',
        edit: 'erm/task/edit',
        delete: 'erm/task/delete',
      },
      domain: {
        tree: 'erm/domain/tree',
      },
      warranty: {
        list: 'erm/warranty/list',
      },
      mandatoryUnit: {
        list: 'erm/mandatory-unit/list',
      },
      compliance: {
        list: 'erm/compliance/list',
        dashboard: 'erm/compliance/dashboard',
        performance: 'erm/compliance/performance',
        progress: 'erm/compliance/progress',
        progressDetail: 'erm/compliance/progress/detail',
      },
      risk: {
        list: 'erm/risk/list',
        dashboard: 'erm/risk/dashboard',
        performance: 'erm/risk/performance',
        progress: 'erm/risk/progress',
        progressDetail: 'erm/risk/progress/detail',
        responseType: 'erm/risk/response/type',
      },
      member: {
        list: 'erm/member/list',
        lightList: 'erm/member/light-list',
        view: 'erm/member/view',
        add: 'erm/member/add',
        update: 'erm/member/update',
        status: 'erm/member/status',
        delete: 'erm/member/delete',
        password: 'erm/member/password',
      },
      role: {
        list: 'erm/role/list',
      },
      ruleAuthor: {
        list: 'erm/rule/author/list',
        add: 'erm/rule/author/add',
        edit: 'erm/rule/author/edit',
        delete: 'erm/rule/author/delete',
      },
      ruleType: {
        list: 'erm/rule/type/list',
        add: 'erm/rule/type/add',
        edit: 'erm/rule/type/edit',
        delete: 'erm/rule/type/delete',
      },
    },

    esg: {
      governance: {
        list: 'content/item/list',
        update: 'content/item/update',
      },
      dashboard: {
        get: 'content/dashboard/get',
      },
    }
  },
};
