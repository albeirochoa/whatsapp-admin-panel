export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      projects: 1,
      agents: 2,
      monthlyLeads: 100
    },
    features: [
      '1 proyecto',
      '2 agentes',
      '100 leads/mes',
      'Widget básico',
      'Soporte por email'
    ]
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    limits: {
      projects: 3,
      agents: 10,
      monthlyLeads: 1000
    },
    features: [
      '3 proyectos',
      '10 agentes',
      '1,000 leads/mes',
      'Widget personalizado',
      'Analytics básico',
      'Soporte prioritario'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 79,
    limits: {
      projects: 10,
      agents: 50,
      monthlyLeads: 10000
    },
    features: [
      '10 proyectos',
      '50 agentes',
      '10,000 leads/mes',
      'Widget avanzado',
      'Analytics completo',
      'Webhooks ilimitados',
      'Soporte 24/7',
      'API access'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    limits: {
      projects: -1, // unlimited
      agents: -1,
      monthlyLeads: -1
    },
    features: [
      'Proyectos ilimitados',
      'Agentes ilimitados',
      'Leads ilimitados',
      'White label',
      'Soporte dedicado',
      'SLA garantizado',
      'Onboarding personalizado',
      'Custom integrations'
    ]
  }
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLIENT: 'client'
};

export const PERMISSIONS = {
  // Super Admin
  MANAGE_ALL_USERS: 'manage_all_users',
  MANAGE_PLANS: 'manage_plans',
  VIEW_ANALYTICS: 'view_analytics',

  // Admin
  MANAGE_OWN_ACCOUNT: 'manage_own_account',

  // Client
  CREATE_PROJECTS: 'create_projects',
  CREATE_AGENTS: 'create_agents',
  VIEW_CODE: 'view_code'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.MANAGE_PLANS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_OWN_ACCOUNT,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.CREATE_AGENTS,
    PERMISSIONS.VIEW_CODE
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_OWN_ACCOUNT,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.CREATE_AGENTS,
    PERMISSIONS.VIEW_CODE
  ],
  [ROLES.CLIENT]: [
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.CREATE_AGENTS,
    PERMISSIONS.VIEW_CODE
  ]
};
