import { ROLE_PERMISSIONS, PLANS } from '../constants/plans';

export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const canCreateProject = (userRole, currentProjects, userPlan) => {
  const plan = PLANS[userPlan?.toUpperCase()] || PLANS.FREE;

  // Unlimited
  if (plan.limits.projects === -1) return true;

  // Check limit
  return currentProjects < plan.limits.projects;
};

export const canCreateAgent = (userRole, projectAgents, userPlan) => {
  const plan = PLANS[userPlan?.toUpperCase()] || PLANS.FREE;

  // Unlimited
  if (plan.limits.agents === -1) return true;

  // Check limit
  return projectAgents < plan.limits.agents;
};

export const getPlanLimits = (planId) => {
  const plan = PLANS[planId?.toUpperCase()] || PLANS.FREE;
  return plan.limits;
};

export const formatLimit = (limit) => {
  if (limit === -1) return 'Ilimitado';
  return limit.toLocaleString();
};
