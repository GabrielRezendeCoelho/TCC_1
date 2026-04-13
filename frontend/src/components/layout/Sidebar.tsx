import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Barra lateral de navegação principal do painel operacional.
 */
export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '📊 Dashboard', icon: 'dashboard' },
    { path: '/packages', label: '📦 Pacotes', icon: 'packages' },
    { path: '/routes', label: '🗺️ Rotas', icon: 'routes' },
    { path: '/drivers', label: '🚗 Motoristas', icon: 'drivers' },
  ];

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">TrackGo</h1>
        <span className="sidebar-subtitle">Painel Operacional</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
            end={item.path === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-role">{user?.role}</span>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} id="logout-button">
          Sair
        </button>
      </div>
    </aside>
  );
}
