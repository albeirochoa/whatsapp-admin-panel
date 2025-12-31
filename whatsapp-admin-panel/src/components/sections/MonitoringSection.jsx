import React from 'react';
import { useConversions } from '../../hooks/useConversions';

const MonitoringSection = ({ selectedProject }) => {
    const { conversions, stats, loading } = useConversions(selectedProject);

    console.log('DEBUG: MonitoringSection selectedProject:', selectedProject);
    console.log('DEBUG: MonitoringSection conversions:', conversions);

    if (!selectedProject) return null;

    return (
        <div className="card" style={{ marginBottom: '30px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>
                    <span style={{ marginRight: '8px' }}>📊</span>
                    Monitor de Conversiones (IA)
                </h3>
                <span style={{
                    fontSize: '12px',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    border: '1px solid #dcfce7'
                }}>
                    En Vivo
                </span>
            </div>

            {/* KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Hoy</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{stats.todayCount}</div>
                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>↑ Conversiones registradas</div>
                </div>

                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    border: '1px solid #bae6fd'
                }}>
                    <div style={{ fontSize: '13px', color: '#0369a1', marginBottom: '4px' }}>Valor Total (Periodo)</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0c4a6e' }}>
                        ${stats.totalValue.toLocaleString('es-CO')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px' }}>Atribuido por IA</div>
                </div>

                <div style={{
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
                    border: '1px solid #f5d0fe'
                }}>
                    <div style={{ fontSize: '13px', color: '#701a75', marginBottom: '4px' }}>Confianza Media IA</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#4a044e' }}>
                        {conversions.length > 0
                            ? (conversions.reduce((acc, c) => acc + (c.ai_confidence || 0), 0) / conversions.length * 100).toFixed(0)
                            : 0}%
                    </div>
                    <div style={{ fontSize: '11px', color: '#701a75', marginTop: '4px' }}>Precisión de clasificación</div>
                </div>
            </div>

            {/* Table */}
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600' }}>Fecha</th>
                            <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600' }}>Cliente</th>
                            <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600' }}>Evento Detectado</th>
                            <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600' }}>Valor</th>
                            <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: '600' }}>Razón IA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    Cargando actividad...
                                </td>
                            </tr>
                        ) : conversions.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    Sin conversiones registradas aún.
                                </td>
                            </tr>
                        ) : (
                            conversions.map((conv) => (
                                <tr key={conv.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                                        {conv.date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{conv.lead_name || 'Anónimo'}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{conv.phone_e164}</div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            background: conv.ai_label === 3 ? '#dcfce7' : conv.ai_label === 2 ? '#fef9c3' : '#f1f5f9',
                                            color: conv.ai_label === 3 ? '#166534' : conv.ai_label === 2 ? '#854d0e' : '#475569',
                                            fontWeight: '700'
                                        }}>
                                            {conv.conversion_name?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', fontWeight: '700', color: '#0f172a' }}>
                                        ${Number(conv.conversion_value || 0).toLocaleString('es-CO')}
                                    </td>
                                    <td style={{ padding: '12px 8px', color: '#64748b', maxWidth: '300px' }}>
                                        <div style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: '2',
                                            WebkitBoxOrient: 'vertical',
                                            fontSize: '12px',
                                            fontStyle: 'italic'
                                        }}>
                                            "{conv.ai_reason}"
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonitoringSection;
