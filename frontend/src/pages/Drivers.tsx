import { useState, useEffect } from 'react';
import { driversService } from '../services/drivers.service';
import { api } from '../services/api';
import type { Driver } from '../types';
import '../pages/Panel.css';
import '../pages/Crud.css';

/**
 * Página CRUD de Motoristas com criação integrada de usuário e soft/hard delete.
 */
export function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Ação de confirmação para Desativar, Ativar ou Excluir (hard delete)
  const [confirmAction, setConfirmAction] = useState<{ driver: Driver; type: 'deactivate' | 'activate' | 'delete' } | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', licenseNumber: '', phone: '',
  });

  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const result = await driversService.findAll(1, 50, search);
      setDrivers(result.drivers || []);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDrivers(); }, [search]);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setEditingDriver(null);
    setForm({ name: '', email: '', password: '', licenseNumber: '', phone: '' });
    setShowModal(true);
  }

  function openEdit(driver: Driver) {
    setEditingDriver(driver);
    setForm({
      name: driver.user?.name || '',
      email: driver.user?.email || '',
      password: '',
      licenseNumber: driver.licenseNumber,
      phone: driver.phone,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.licenseNumber || !form.phone) return;
    setSaving(true);
    try {
      if (editingDriver) {
        // Atualiza campos do Driver
        await driversService.update(editingDriver.id, {
          licenseNumber: form.licenseNumber,
          phone: form.phone,
        });
        
        // Se mudou algo de usuário, poderia criar uma chamada de update user aqui (opcional)
        if (editingDriver.user?.id && form.name) {
             await api.patch(`/users/${editingDriver.user.id}`, { name: form.name });
        }

        showToast('Motorista atualizado com sucesso');
      } else {
        if (!form.name || !form.email || !form.password) {
          showToast('Preencha os dados do usuário', 'error');
          setSaving(false); return;
        }
        
        // 1. Cria o usuário com regra DRIVER
        const { data: userRes } = await api.post('/users', {
          name: form.name, email: form.email, password: form.password, role: 'DRIVER'
        });
        
        // 2. Cria o perfil do motorista vinculado
        await driversService.create({
          licenseNumber: form.licenseNumber,
          phone: form.phone,
          userId: userRes.data?.id || userRes.id,
        });

        showToast('Motorista cadastrado com sucesso');
      }
      setShowModal(false);
      loadDrivers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'deactivate') {
        await api.delete(`/drivers/${confirmAction.driver.id}`);
        showToast('Motorista desativado');
      } else if (confirmAction.type === 'activate') {
        await api.patch(`/drivers/${confirmAction.driver.id}/activate`);
        showToast('Motorista ativado');
      } else {
        await api.delete(`/drivers/${confirmAction.driver.id}/hard`);
        showToast('Motorista excluído permanentemente');
      }
      setConfirmAction(null);
      loadDrivers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro na operação', 'error');
    }
  }

  return (
    <div className="page" id="drivers-page">
      <header className="page-header">
        <h1>Motoristas</h1>
        <div className="page-actions">
          <input type="search" placeholder="Buscar motorista..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-input" id="drivers-search" />
          <button className="btn-new" onClick={openNew}>+ Novo Motorista</button>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="drivers-table">
            <thead>
              <tr>
                <th>Nome</th><th>E-mail</th><th>CNH</th><th>Telefone</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">Nenhum motorista encontrado</td></tr>
              ) : (
                drivers.map((driver) => {
                  const isActive = (driver as any).user?.isActive ?? true;
                  return (
                  <tr key={driver.id}>
                    <td><strong>{driver.user?.name}</strong></td>
                    <td>{driver.user?.email}</td>
                    <td><code>{driver.licenseNumber}</code></td>
                    <td>{driver.phone}</td>
                    <td>
                      <span className={`badge ${isActive ? 'badge--completed' : 'badge--returned'}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon edit" title="Editar" onClick={() => openEdit(driver)}>✏️</button>
                        {isActive ? (
                          <button className="btn-icon" title="Desativar" onClick={() => setConfirmAction({ driver, type: 'deactivate' })}
                            style={{ color: '#D97706' }}>⛔</button>
                        ) : (
                          <button className="btn-icon" title="Ativar" onClick={() => setConfirmAction({ driver, type: 'activate' })}
                            style={{ color: '#10B981' }}>✅</button>
                        )}
                        <button className="btn-icon delete" title="Excluir" onClick={() => setConfirmAction({ driver, type: 'delete' })}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingDriver ? 'Editar Motorista' : 'Novo Motorista'}</h2>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
                </div>
                <div className="form-group">
                  <label>E-mail *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="motorista@trackgo.com" disabled={!!editingDriver} />
                </div>
              </div>
              {!editingDriver && (
                <div className="form-group">
                  <label>Senha *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Número da CNH *</label>
                  <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="12345678900" />
                </div>
                <div className="form-group">
                  <label>Telefone *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11999999999" />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : (editingDriver ? 'Atualizar' : 'Cadastrar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Ação */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>
              {confirmAction.type === 'deactivate' ? '⛔ Desativar Motorista' : 
               confirmAction.type === 'activate' ? '✅ Ativar Motorista' : '🗑️ Excluir Permanentemente'}
            </h2>
            <p className="confirm-text">
              {confirmAction.type === 'deactivate'
                ? <>Deseja desativar <strong>{confirmAction.driver.user?.name}</strong>? O login será bloqueado para o aplicativo.</>
                : confirmAction.type === 'activate'
                ? <>Deseja reativar o acesso de <strong>{confirmAction.driver.user?.name}</strong> para entregas?</>
                : <>Deseja excluir <strong style={{ color: 'var(--color-error)' }}>{confirmAction.driver.user?.name}</strong> permanentemente? Essa ação removerá o perfil e o acesso.</>}
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
