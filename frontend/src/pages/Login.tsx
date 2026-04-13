import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

/**
 * Ícone SVG do olho aberto (senha visível).
 */
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * Ícone SVG do olho fechado (senha oculta).
 */
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * Ícone de alerta para mensagem de erro.
 */
function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * Valida formato do e-mail com regex simples.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Página de Login do Painel Operacional.
 * Funcionalidades: validação inline, toggle senha, caps lock, esqueci senha (modal), loading, Enter submit.
 */
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // Erros individuais dos campos
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Erro global da API
  const [apiError, setApiError] = useState('');

  // Modal de esqueci senha
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Valida os campos antes de submeter. Retorna true se tudo OK.
   */
  function validateFields(): boolean {
    let valid = true;

    // Limpa erros anteriores
    setEmailError('');
    setPasswordError('');
    setApiError('');

    if (!email.trim()) {
      setEmailError('Informe seu e-mail');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Digite um e-mail válido');
      valid = false;
    }

    if (!password) {
      setPasswordError('Informe sua senha');
      valid = false;
    }

    return valid;
  }

  /**
   * Handler do submit (formulário ou Enter).
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!validateFields()) return;

    setIsLoading(true);
    setApiError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setApiError('E-mail ou senha inválidos');
      } else if (status === 400) {
        const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message;
        setApiError(msg || 'Preencha os campos obrigatórios');
      } else {
        setApiError('Não foi possível acessar sua conta. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Detecta Caps Lock ativo no campo de senha.
   */
  function handlePasswordKeyEvent(e: KeyboardEvent<HTMLInputElement>) {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  }

  /**
   * Simula envio de recuperação de senha.
   */
  async function handleForgotSubmit() {
    if (!forgotEmail.trim() || !isValidEmail(forgotEmail)) return;
    setForgotLoading(true);

    // Simula delay de envio (a integração real virá depois)
    await new Promise((r) => setTimeout(r, 1500));

    setForgotLoading(false);
    setForgotSent(true);
  }

  function closeForgotModal() {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotSent(false);
    setForgotLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card">

        {/* ===== Header com Logo ===== */}
        <header className="login-header">
          <div className="login-logo-icon">📦</div>
          <h1 className="login-logo">TrackGo</h1>
          <p className="login-title">Entrar</p>
          <p className="login-subtitle">Acesse sua conta para continuar</p>
        </header>

        {/* ===== Formulário ===== */}
        <form onSubmit={handleSubmit} className="login-form" id="login-form" noValidate>

          {/* Alerta global de erro da API */}
          {apiError && (
            <div className="error-alert" id="login-error" role="alert">
              <AlertIcon />
              <span>{apiError}</span>
            </div>
          )}

          {/* Campo de E-mail */}
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                className={emailError ? 'input-error' : ''}
              />
            </div>
            {emailError && <span className="field-error">{emailError}</span>}
          </div>

          {/* Campo de Senha com Toggle do Olho */}
          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                onKeyDown={handlePasswordKeyEvent}
                onKeyUp={handlePasswordKeyEvent}
                placeholder="••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className={`has-toggle ${passwordError ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && <span className="field-error">{passwordError}</span>}
            {capsLockOn && !passwordError && (
              <span className="caps-warning">⚠ Caps Lock está ativado</span>
            )}
          </div>

          {/* Link Esqueci Senha */}
          <div className="forgot-password-row">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => { setShowForgotModal(true); setForgotEmail(email); }}
            >
              Esqueci minha senha
            </button>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            id="login-submit"
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>

      {/* ===== Modal Esqueci Minha Senha ===== */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {!forgotSent ? (
              <>
                <h2>Recuperar senha</h2>
                <p>
                  Informe seu e-mail cadastrado e enviaremos as instruções
                  para redefinir sua senha.
                </p>

                <div className="input-group">
                  <label htmlFor="forgot-email">E-mail</label>
                  <div className="input-wrapper">
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeForgotModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-modal-primary"
                    onClick={handleForgotSubmit}
                    disabled={forgotLoading || !forgotEmail.trim()}
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>E-mail enviado ✓</h2>
                <p>
                  Se o e-mail <strong>{forgotEmail}</strong> estiver cadastrado,
                  você receberá as instruções em instantes.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn-modal-primary" onClick={closeForgotModal}>
                    Voltar ao login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
