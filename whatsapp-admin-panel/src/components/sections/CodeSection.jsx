import { useState } from 'react';
import { generateOptimizedWidgetCode } from '../../utils/widgetCodeGenerator.optimized';

const CodeSection = ({ user, selectedProject }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const code = generateOptimizedWidgetCode(user, selectedProject);
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
          Código para instalar (Optimizado 🚀)
        </h3>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyCode}>
          {copied ? '✓ Copiado!' : 'Copiar código'}
        </button>
      </div>
      <div style={{
        padding: '12px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '13px',
        color: '#047857'
      }}>
        ✅ Código optimizado - Lee de Firebase Storage (98% menos costo)
      </div>
      <pre className="code-block">
        <code>{generateOptimizedWidgetCode(user, selectedProject)}</code>
      </pre>
    </div>
  );
};

export default CodeSection;
