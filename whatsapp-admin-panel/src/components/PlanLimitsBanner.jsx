import React from 'react';
import { PLANS } from '../constants/plans';
import { formatLimit } from '../utils/permissions';

const PlanLimitsBanner = ({ userData, projects, agents }) => {
  if (!userData) return null;

  const plan = PLANS[userData.subscription?.plan?.toUpperCase()] || PLANS.FREE;
  const limits = plan.limits;

  const projectsUsage = (projects.length / (limits.projects === -1 ? 1 : limits.projects)) * 100;
  const agentsUsage = (agents.length / (limits.agents === -1 ? 1 : limits.agents)) * 100;

  const isNearLimit = projectsUsage > 80 || agentsUsage > 80;
  const isAtLimit = projectsUsage >= 100 || agentsUsage >= 100;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <div className={`limits-banner ${isAtLimit ? 'limits-critical' : 'limits-warning'}`}>
      <div className="limits-icon">
        {isAtLimit ? '⚠️' : '📊'}
      </div>
      <div className="limits-content">
        <div className="limits-title">
          {isAtLimit ? 'Límite alcanzado' : 'Cerca del límite'}
        </div>
        <div className="limits-text">
          Plan {plan.name}: {projects.length}/{formatLimit(limits.projects)} proyectos, {agents.length}/{formatLimit(limits.agents)} agentes
        </div>
      </div>
      <button className="limits-upgrade-btn">
        Actualizar Plan
      </button>
    </div>
  );
};

export default PlanLimitsBanner;
