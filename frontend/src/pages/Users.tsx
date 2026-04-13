import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
import '../pages/Panel.css';
import '../pages/Crud.css';

/**
 * Página CRUD de Usuários com Desativar (soft) e Excluir (hard delete).
 */
export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: User; type: 'deactivate' | 'delete' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPERATOR' });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page: 1, limit: 50, ...(search && { search }) };
      const { data } = await api.get('/users', { params });
      setUsers(data.data?.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [search]);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'OPERATOR' });
    setShowModal(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role, ...(form.password && { password: form.password }) };
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, payload);
        showToast('Usuário atualizado');
      } else {
        if (!form.password) { showToast('Senha obrigatória', 'error'); setSaving(false); return; }
        await api.post('/users', payload);
        showToast('Usuário cadastrado');
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally { setSaving(false); }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'deactivate') {
        await api.delete(`/users/${confirmAction.user.id}`);
        showToast('Usuário desativado');
      } else if (confirmAction.type === 'activate') {
        await api.patch(`/users/${confirmAction.user.id}`, { isActive: true });
        showToast('Usuário ativado');
      } else {
        await api.delete(`/users/${confirmAction.user.id}/hard`);
        showToast('Usuário excluído permanentemente');
      }
      setConfirmAction(null);
      loadUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro na operação', 'error');
    }
  }

  const roleLabel: Record<string, string> = { ADMIN: 'Administrador', OPERATOR: 'Operador', DRIVER: 'Motorista', CLIENT: 'Cliente' };

  return (
    <div className="page" id="users-page">
      <header className="page-header">
        <h1>Usuários</h1>
        <div className="page-actions">
          <input type="search" placeholder="Buscar usuário..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-input" id="users-search" />
          <button className="btn-new" onClick={openNew}>+ Novo Usuário</button>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="users-table">
            <thead>
              <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">Nenhum usuário encontrado</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge--${u.role.toLowerCase()}`}>{roleLabel[u.role] || u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge--completed' : 'badge--returned'}`}>{u.isActive ? 'Ativo' : 'Inativo'}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon edit" title="Editar" onClick={() => openEdit(u)}>✏️</button>
                        {u.isActive ? (
                          <button className="btn-icon" title="Desativar" onClick={() => setConfirmAction({ user: u, type: 'deactivate' as const })}
                            style={{ color: '#D97706' }}>⛔</button>
                        ) : (
                          <button className="btn-icon" title="Ativar" onClick={() => setConfirmAction({ user: u, type: 'activate' as const })}
                            style={{ color: '#10B981' }}>✅</button>
                        )}
                        <button className="btn-icon delete" title="Excluir permanentemente" onClick={() => setConfirmAction({ user: u, type: 'delete' as const })}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Nome *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
                <div className="form-group"><label>E-mail *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@trackgo.com" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>{editingUser ? 'Nova Senha (opcional)' : 'Senha *'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
                <div className="form-group"><label>Perfil *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="ADMIN">Administrador</option><option value="OPERATOR">Operador</option>
                    <option value="DRIVER">Motorista</option><option value="CLIENT">Cliente</option>
                  </select></div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Cadastrar')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Ação */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>
              {confirmAction.type === 'deactivate' ? '⛔ Desativar Usuário' : 
               confirmAction.type === 'activate' ? '✅ Ativar Usuário' : '🗑️ Excluir Permanentemente'}
            </h2>
            <p className="confirm-text">
              {confirmAction.type === 'deactivate'
                ? <>Deseja desativar <strong>{confirmAction.user.name}</strong>? O login será bloqueado.</>
                : confirmAction.type === 'activate'
                ? <>Deseja reativar <strong>{confirmAction.user.name}</strong>? O acesso será restaurado.</>
                : <>Deseja excluir <strong style={{ color: 'var(--color-error)' }}>{confirmAction.user.name}</strong> permanentemente?</>}
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmAction(null)}>Cancelar</button>
              <button className={confirmAction.type === 'activate' ? 'btn-save' : 'btn-danger'} onClick={handleConfirmAction}>
                {confirmAction.type === 'deactivate' ? 'Desativar' : 
                 confirmAction.type === 'activate' ? 'Ativar' : 'Excluir Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
