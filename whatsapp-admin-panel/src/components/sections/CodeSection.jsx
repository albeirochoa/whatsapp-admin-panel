import React, { useState } from 'react';
import { generateWidgetCode } from '../../utils/widgetCodeGenerator';

const CodeSection = ({ user, selectedProject }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const code = generateWidgetCode(user, selectedProject);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <div className="code-header">
        <h3 className="card-title" style={{ marginBottom: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Código para instalar
        </h3>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyCode}>
          {copied ? '✓ Copiado!' : 'Copiar código'}
        </button>
      </div>
      <pre className="code-block">
        <code>{generateWidgetCode(user, selectedProject)}</code>
      </pre>
    </div>
  );
};

export default CodeSection;
