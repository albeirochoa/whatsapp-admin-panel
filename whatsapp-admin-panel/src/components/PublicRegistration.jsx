import React, { useState } from 'react';
import { PLANS } from '../constants/plans';
import { WhatsAppIcon, GoogleIcon } from './Icons';

const PublicRegistration = ({ onLogin }) => {
  const [selectedPlan, setSelectedPlan] = useState('free');

  const plans = Object.values(PLANS);

  return (
    <div className="registration-container">
      <div className="registration-header">
        <div className="login-logo">
          <WhatsAppIcon />
        </div>
        <h1 className="login-title">WhatsApp Widget Admin</h1>
        <p className="login-subtitle">Crea widgets de WhatsApp inteligentes para tu sitio web</p>
      </div>

      <div className="plans-grid">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'plan-selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.id === 'pro' && <div className="plan-badge">Popular</div>}

            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price-currency">$</span>
                <span className="price-amount">{plan.price}</span>
                {plan.price > 0 && <span className="price-period">/mes</span>}
              </div>
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {selectedPlan === plan.id && (
              <div className="plan-selected-indicator">✓ Seleccionado</div>
            )}
          </div>
        ))}
      </div>

      <div className="registration-cta">
        <p className="cta-text">
          Empieza con el plan <strong>{PLANS[selectedPlan.toUpperCase()].name}</strong>
        </p>
        <button className="google-btn google-btn-large" onClick={() => onLogin(selectedPlan)}>
          <GoogleIcon />
          Continuar con Google
        </button>
        <p className="cta-note">
          Sin tarjeta de crédito • Cancela cuando quieras
        </p>
      </div>
    </div>
  );
};

export default PublicRegistration;
