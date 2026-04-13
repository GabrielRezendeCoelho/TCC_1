import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import '../../pages/Crud.css';

/**
 * Sidebar com navegação e modal de perfil (endereço base).
 */
export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', baseAddress: '', baseLat: '', baseLng: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // Carrega perfil ao abrir modal
  useEffect(() => {
    if (showProfile) {
      api.get('/auth/profile').then(({ data }) => {
        const p = data.data || data;
        setProfileForm({
          name: p.name || '',
          baseAddress: p.baseAddress || '',
          baseLat: p.baseLat?.toString() || '',
          baseLng: p.baseLng?.toString() || '',
        });
      }).catch(() => {});
    }
  }, [showProfile]);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await api.patch('/auth/profile', {
        name: profileForm.name,
        baseAddress: profileForm.baseAddress || undefined,
        baseLat: profileForm.baseLat ? parseFloat(profileForm.baseLat) : undefined,
        baseLng: profileForm.baseLng ? parseFloat(profileForm.baseLng) : undefined,
      });
      showToast('Perfil atualizado!');
      setShowProfile(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/', label: 'Dashboard', emoji: '📊' },
    { path: '/packages', label: 'Entregas', emoji: '📦' },
    { path: '/routes', label: 'Rotas', emoji: '🗺️' },
    { path: '/drivers', label: 'Motoristas', emoji: '🚗' },
    { path: '/users', label: 'Usuários', emoji: '👥' },
  ];

  return (
    <>
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">📦</div>
          <span className="sidebar-logo">TrackGo</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              end={item.path === '/'}>
              <span className="link-icon">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>
            <span className="sidebar-user-name">{user?.name || 'Usuário'}</span>
            <span className="sidebar-user-role">{user?.role || 'ADMIN'}</span>
            <span style={{ fontSize: '0.625rem', color: '#60A5FA', marginTop: '2px' }}>Editar perfil →</span>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} id="logout-button">Sair da Conta</button>
        </div>
      </aside>

      {/* Modal de Perfil */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Meu Perfil</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Nome</label>
                <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>📍 Endereço da Base (ponto de partida das rotas)</label>
                <input value={profileForm.baseAddress} onChange={(e) => setProfileForm({ ...profileForm, baseAddress: e.target.value })}
                  placeholder="Rua da Base, 100, São Paulo, SP" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude da Base</label>
                  <input type="number" step="any" value={profileForm.baseLat} onChange={(e) => setProfileForm({ ...profileForm, baseLat: e.target.value })}
                    placeholder="-23.550520" />
                </div>
                <div className="form-group">
                  <label>Longitude da Base</label>
                  <input type="number" step="any" value={profileForm.baseLng} onChange={(e) => setProfileForm({ ...profileForm, baseLng: e.target.value })}
                    placeholder="-46.633308" />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                ⚠️ O endereço da base é usado como ponto de partida para gerar rotas inteligentes.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowProfile(false)}>Fechar</button>
              <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
