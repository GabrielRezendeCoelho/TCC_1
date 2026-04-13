import { useState, useEffect } from 'react';
import { routesService } from '../services/routes.service';
import { packagesService } from '../services/packages.service';
import type { DeliveryRoute, Package } from '../types';
import '../pages/Panel.css';
import '../pages/Crud.css';

/**
 * Página CRUD de Rotas de Entrega com Geração Inteligente.
 */
export function Routes() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [unassignedPackages, setUnassignedPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  
  const [editingRoute, setEditingRoute] = useState<DeliveryRoute | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeliveryRoute | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const [form, setForm] = useState({ name: '', date: '' });

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const result = await routesService.findAll(1, 50, search);
      setRoutes(result.routes || []);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnassignedPackages = async () => {
    try {
      const pkgs = await packagesService.findUnassigned();
      setUnassignedPackages(pkgs.length ? pkgs : (pkgs.packages || []));
    } catch (e) {
      console.error('Erro ao carregar pacotes sem rota', e);
    }
  };

  useEffect(() => { loadRoutes(); }, [search]);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setEditingRoute(null);
    setForm({ name: '', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  }

  async function openSmartRoute() {
    setForm({ name: 'Rota Inteligente - ' + new Date().toLocaleDateString('pt-BR'), date: new Date().toISOString().split('T')[0] });
    setSelectedPackages([]);
    await loadUnassignedPackages();
    setShowSmartModal(true);
  }

  function openEdit(route: DeliveryRoute) {
    setEditingRoute(route);
    setForm({
      name: route.name,
      date: route.date?.split('T')[0] || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.date) return;
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        date: new Date(form.date).toISOString(),
      };
      if (editingRoute) {
        await routesService.update(editingRoute.id, payload);
        showToast('Rota atualizada com sucesso');
      } else {
        await routesService.create(payload);
        showToast('Rota criada com sucesso');
      }
      setShowModal(false);
      loadRoutes();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateSmart() {
    if (!form.name || !form.date || selectedPackages.length === 0) {
      showToast('Preencha os dados e selecione ao menos um pacote', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await routesService.generateSmart({
        name: form.name,
        date: new Date(form.date).toISOString(),
        packageIds: selectedPackages
      });
      showToast('Rota inteligente gerada com sucesso!', 'success');
      setShowSmartModal(false);
      loadRoutes();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao gerar rota inteligente. Verifique se o endereço da base está no seu perfil.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await routesService.remove(confirmDelete.id);
      showToast('Rota removida');
      setConfirmDelete(null);
      loadRoutes();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao remover', 'error');
    }
  }

  function togglePackage(id: string) {
    setSelectedPackages(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  const statusLabel: Record<string, string> = {
    DRAFT: 'Rascunho', OPTIMIZED: 'Otimizada', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluída',
  };

  return (
    <div className="page" id="routes-page">
      <header className="page-header">
        <h1>Rotas</h1>
        <div className="page-actions">
          <input type="search" placeholder="Buscar rota..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-input" id="routes-search" />
          <button className="btn-new" onClick={openNew} style={{ background: '#64748B' }}>Nova Rota Manual</button>
          <button className="btn-new" onClick={openSmartRoute} style={{ background: '#7C3AED' }}>🧠 Gerar Rota Inteligente</button>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="routes-table">
            <thead>
              <tr>
                <th>Nome</th><th>Data</th><th>Pacotes</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr><td colSpan={5} className="table-empty">Nenhuma rota encontrada</td></tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id}>
                    <td><strong>{route.name}</strong></td>
                    <td>{new Date(route.date).toLocaleDateString('pt-BR')}</td>
                    <td>{route._count?.packages ?? 0}</td>
                    <td><span className={`badge badge--${route.status.toLowerCase()}`}>{statusLabel[route.status]}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon edit" title="Editar" onClick={() => openEdit(route)}>✏️</button>
                        <button className="btn-icon delete" title="Excluir" onClick={() => setConfirmDelete(route)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar Rota Manual */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRoute ? 'Editar Rota' : 'Nova Rota Manual'}</h2>
            <div className="modal-form">
              <div className="form-group">
                <label>Nome da Rota *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Zona Sul - Manhã" />
              </div>
              <div className="form-group">
                <label>Data *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : (editingRoute ? 'Atualizar' : 'Criar Rota')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerar Rota Inteligente */}
      {showSmartModal && (
        <div className="modal-overlay" onClick={() => setShowSmartModal(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <h2>🧠 Gerar Rota Inteligente</h2>
            <p>O sistema irá organizar os pacotes selecionados usando o endereço da sua Base como ponto de partida, calculando a melhor ordem geográfica do mais próximo ao mais distante.</p>
            
            <div className="modal-form" style={{ marginTop: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome da Rota *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Data *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>📦 Selecione os pacotes pendentes para a rota:</label>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px' }}>
                  {unassignedPackages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px 0' }}>Não há pacotes aguardando rota no momento.</p>
                  ) : (
                    unassignedPackages.map(pkg => (
                      <label key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedPackages.includes(pkg.id)}
                          onChange={() => togglePackage(pkg.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, color: '#1F2937' }}>{pkg.recipientName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>📍 {pkg.address}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '6px' }}>
                  {selectedPackages.length} pacote(s) selecionado(s)
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowSmartModal(false)}>Cancelar</button>
              <button className="btn-save" style={{ background: '#7C3AED' }} onClick={handleGenerateSmart} disabled={saving || selectedPackages.length === 0}>
                {saving ? 'Organizando Rota...' : '🪄 Gerar Ordem Inteligente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar Exclusão</h2>
            <p className="confirm-text">Tem certeza que deseja excluir a rota <strong>{confirmDelete.name}</strong>? Os pacotes voltarão para o status Pendente.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
