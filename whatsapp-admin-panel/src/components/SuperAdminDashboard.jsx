import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PLANS, ROLES } from '../constants/plans';
import Header from './Header';

const SuperAdminDashboard = ({ user, onLogout, onSwitchView }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalAgents: 0,
    planDistribution: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUsers(usersList);
      calculateStats(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error cargando usuarios: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersList) => {
    const planDist = {};
    let totalProjects = 0;
    let totalAgents = 0;

    usersList.forEach(user => {
      const plan = user.subscription?.plan || 'free';
      planDist[plan] = (planDist[plan] || 0) + 1;
      totalProjects += user.usage?.projects || 0;
      totalAgents += user.usage?.agents || 0;
    });

    setStats({
      totalUsers: usersList.length,
      totalProjects,
      totalAgents,
      planDistribution: planDist
    });
  };

  const updateUserPlan = async (userId, newPlan) => {
    try {
      const userRef = doc(db, 'users', userId);
      const planData = PLANS[newPlan.toUpperCase()];

      await updateDoc(userRef, {
        plan: newPlan,
        'subscription.plan': newPlan,
        'subscription.limits': planData.limits,
        'subscription.updatedAt': new Date().toISOString()
      });

      await loadUsers();
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Error al actualizar el plan');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />

      <div className="super-admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Super Admin Dashboard</h1>
            <p className="admin-subtitle">Gestión de usuarios y estadísticas del sistema</p>
          </div>
          <button
            className="btn-primary"
            onClick={onSwitchView}
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📂</span> Gestionar Mis Proyectos
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Usuarios</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌐</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalProjects}</div>
              <div className="stat-label">Total Proyectos</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalAgents}</div>
              <div className="stat-label">Total Agentes</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <div className="stat-value">
                {Object.entries(stats.planDistribution).map(([plan, count]) => (
                  <div key={plan} className="plan-stat">
                    <span className="plan-stat-name">{plan.toUpperCase()}</span>
                    <span className="plan-stat-count">{count}</span>
                  </div>
                ))}
              </div>
              <div className="stat-label">Distribución de Planes</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-card">
          <h2 className="card-title">Gestión de Usuarios</h2>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Cargando usuarios...</p>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Plan</th>
                    <th>Proyectos</th>
                    <th>Agentes</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id}>
                      <td>
                        <div className="user-cell">
                          <img src={userItem.photoURL} alt="" className="table-avatar" />
                          <span>{userItem.displayName}</span>
                        </div>
                      </td>
                      <td>{userItem.email}</td>
                      <td>
                        <select
                          className="role-select"
                          value={userItem.role || ROLES.CLIENT}
                          onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                        >
                          <option value={ROLES.CLIENT}>Cliente</option>
                          <option value={ROLES.ADMIN}>Admin</option>
                          <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="plan-select"
                          value={userItem.subscription?.plan || 'free'}
                          onChange={(e) => updateUserPlan(userItem.id, e.target.value)}
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="text-center">{userItem.usage?.projects || 0}</td>
                      <td className="text-center">{userItem.usage?.agents || 0}</td>
                      <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-delete-small"
                          onClick={() => deleteUser(userItem.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
