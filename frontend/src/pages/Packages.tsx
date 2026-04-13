import { useState, useEffect, useRef } from 'react';
import { packagesService } from '../services/packages.service';
import type { Package } from '../types';
import '../pages/Panel.css';
import '../pages/Crud.css';

/**
 * Página CRUD de Pacotes/Entregas com Scanner Dinâmico.
 */
export function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // Estados do Scanner
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Campos do formulário sem lat/lng
  const [form, setForm] = useState({
    trackingCode: '', recipientName: '', recipientPhone: '', address: '', weight: '', clientId: '',
  });

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const result = await packagesService.findAll(1, 50, search);
      setPackages(result.packages || []);
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPackages(); }, [search]);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setEditingPkg(null);
    setForm({ trackingCode: '', recipientName: '', recipientPhone: '', address: '',  weight: '', clientId: '' });
    setShowModal(true);
  }

  function openEdit(pkg: Package) {
    setEditingPkg(pkg);
    setForm({
      trackingCode: pkg.trackingCode || '',
      recipientName: pkg.recipientName,
      recipientPhone: pkg.recipientPhone || '',
      address: pkg.address,
      weight: pkg.weight?.toString() || '',
      clientId: '',
    });
    setShowModal(true);
  }

  /* ===== Lógica do Scanner Nativado (BarcodeDetector API) ===== */
  async function startScanner() {
    if (!('BarcodeDetector' in window)) {
      showToast('O Scanner inteligente não é suportado pelo seu navegador (use o Chrome ou Android).', 'error');
      return;
    }

    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanFrame();
      }
    } catch (err) {
      setIsScanning(false);
      showToast('Erro ao acessar a câmera. Verifique as permissões.', 'error');
    }
  }

  function stopScanner() {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  const scanFrame = async () => {
    if (!isScanning || !videoRef.current) return;
    
    try {
      // @ts-ignore - BarcodeDetector ainda não está no TS oficial padrão de muitos setups
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
      const barcodes = await barcodeDetector.detect(videoRef.current);
      
      if (barcodes.length > 0) {
        const detectedCode = barcodes[0].rawValue;
        setForm(prev => ({ ...prev, trackingCode: detectedCode }));
        showToast('Código lido com sucesso!');
        stopScanner();
        return;
      }
    } catch (e) {
      // Falha silenciosa por frame
    }
    
    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  // Garante que a câmera desliga se fechar o modal
  useEffect(() => {
    if (!showModal && isScanning) {
      stopScanner();
    }
    return () => stopScanner();
  }, [showModal, isScanning]);


  async function handleSave() {
    if (!form.recipientName || !form.address) return;
    setSaving(true);
    try {
      const payload: any = {
        recipientName: form.recipientName,
        address: form.address,
        ...(form.trackingCode && { trackingCode: form.trackingCode }),
        ...(form.recipientPhone && { recipientPhone: form.recipientPhone }),
        ...(form.weight && { weight: parseFloat(form.weight) }),
        ...(form.clientId && { clientId: form.clientId }),
      };
      if (editingPkg) {
        await packagesService.update(editingPkg.id, payload);
        showToast('Pacote atualizado');
      } else {
        await packagesService.create(payload);
        showToast('Pacote cadastrado');
      }
      setShowModal(false);
      loadPackages();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await packagesService.remove(confirmDelete.id);
      showToast('Pacote removido');
      setConfirmDelete(null);
      loadPackages();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erro ao remover', 'error');
    }
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente', IN_ROUTE: 'Em rota', DELIVERED: 'Entregue', RETURNED: 'Devolvido',
  };

  return (
    <div className="page" id="packages-page">
      <header className="page-header">
        <h1>Entregas</h1>
        <div className="page-actions">
          <input type="search" placeholder="Buscar pacote..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="search-input" id="packages-search" />
          <button className="btn-new" onClick={openNew}>+ Novo Pacote</button>
        </div>
      </header>

      {isLoading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table" id="packages-table">
            <thead>
              <tr>
                <th>Código</th><th>Destinatário</th><th>Endereço</th><th>Status</th><th>Rota</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">Nenhum pacote encontrado</td></tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td><code>{pkg.trackingCode?.slice(0, 10) || '—'}</code></td>
                    <td>{pkg.recipientName}</td>
                    <td>{pkg.address}</td>
                    <td><span className={`badge badge--${pkg.status.toLowerCase()}`}>{statusLabel[pkg.status]}</span></td>
                    <td>{pkg.route?.name || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon edit" title="Editar" onClick={() => openEdit(pkg)}>✏️</button>
                        <button className="btn-icon delete" title="Excluir" onClick={() => setConfirmDelete(pkg)}>🗑️</button>
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
            <h2>{editingPkg ? 'Editar Pacote' : 'Novo Pacote'}</h2>
            
            <div className="modal-form">
              {/* Opção de Scanear */}
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label>Código de Rastreamento (Opcional - gerado auto se vazio)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ flex: 1 }} value={form.trackingCode} onChange={(e) => setForm({ ...form, trackingCode: e.target.value })} placeholder="TRKG-123..." />
                  <button type="button" onClick={startScanner} style={{ padding: '0 12px', background: '#e0f2fe', color: '#0ea5e9', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    📷 Escanear
                  </button>
                </div>
              </div>

              {isScanning && (
                <div style={{ position: 'relative', width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid #0ea5e9', margin: '30px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)', zIndex: 10, borderRadius: '8px' }}></div>
                  <button onClick={stopScanner} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', zIndex: 20 }}>Fechar Câmera</button>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Destinatário *</label>
                  <input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="Nome do destinatário" />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Endereço *</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro, cidade" />
                </div>
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="0.5" />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setShowModal(false); stopScanner(); }}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : (editingPkg ? 'Atualizar' : 'Cadastrar')}
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
            <p className="confirm-text">Tem certeza que deseja excluir o pacote de <strong>{confirmDelete.recipientName}</strong>? Esta ação não pode ser desfeita.</p>
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
