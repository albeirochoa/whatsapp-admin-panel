import { useState } from 'react';
import { generateOptimizedWidgetCode } from '../../utils/widgetCodeGenerator.optimized';
import { generateLoaderSnippet } from '../../utils/widgetJsGenerator';
import { getWidgetJsUrl } from '../../utils/staticJsonPublisher';

const CodeSection = ({ user, selectedProject }) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedLoader, setCopiedLoader] = useState(false);
  const [showLoader, setShowLoader] = useState(true); // Por defecto mostrar loader

  const jsUrl = user && selectedProject ? getWidgetJsUrl(user.uid, selectedProject.id) : '';
  const loaderCode = generateLoaderSnippet(jsUrl);
  const fullCode = generateOptimizedWidgetCode(user, selectedProject);

  const copyLoaderCode = () => {
    navigator.clipboard.writeText(loaderCode);
    setCopiedLoader(true);
    setTimeout(() => setCopiedLoader(false), 2000);
  };

  const copyFullCode = () => {
    navigator.clipboard.writeText(fullCode);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  return (
    <div className="card">
      {/* Tabs para alternar entre Loader y Código Completo */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => setShowLoader(true)}
          style={{
            flex: 1,
            padding: '12px',
            background: showLoader ? '#10b981' : 'transparent',
            color: showLoader ? 'white' : '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontWeight: showLoader ? '600' : '400',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          🎯 Para Tag Manager (Recomendado)
        </button>
        <button
          onClick={() => setShowLoader(false)}
          style={{
            flex: 1,
            padding: '12px',
            background: !showLoader ? '#10b981' : 'transparent',
            color: !showLoader ? 'white' : '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontWeight: !showLoader ? '600' : '400',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          📝 Código Completo
        </button>
      </div>

      {showLoader ? (
        <>
          {/* LOADER SNIPPET */}
          <div className="code-header">
            <h3 className="card-title" style={{ marginBottom: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Snippet para Tag Manager (10 líneas)
            </h3>
            <button className={`copy-btn ${copiedLoader ? 'copied' : ''}`} onClick={copyLoaderCode}>
              {copiedLoader ? '✓ Copiado!' : 'Copiar código'}
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
            ✅ <strong>Script Loader Pattern</strong> - Código limpio en GTM, actualizaciones sin re-deployar
          </div>
          <div style={{
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#1e40af',
            lineHeight: '1.6'
          }}>
            <strong>💡 Ventajas:</strong><br/>
            • Solo 10 líneas en Tag Manager<br/>
            • Cambios en el widget sin tocar GTM<br/>
            • Carga asíncrona (no bloquea página)<br/>
            • Cache automático de 1 hora
          </div>
          <pre className="code-block">
            <code>{loaderCode}</code>
          </pre>
        </>
      ) : (
        <>
          {/* CÓDIGO COMPLETO */}
          <div className="code-header">
            <h3 className="card-title" style={{ marginBottom: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Código Completo (Inserción directa)
            </h3>
            <button className={`copy-btn ${copiedFull ? 'copied' : ''}`} onClick={copyFullCode}>
              {copiedFull ? '✓ Copiado!' : 'Copiar código'}
            </button>
          </div>
          <div style={{
            padding: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#92400e'
          }}>
            ⚠️ <strong>Solo usar si NO tienes Tag Manager</strong> - Código largo, difícil de mantener
          </div>
          <pre className="code-block">
            <code>{fullCode}</code>
          </pre>
        </>
      )}
    </div>
  );
};

export default CodeSection;
