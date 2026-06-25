import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { maskCpf, isValidCpf, unmask } from '../utils/masks'
import './Login.css' // Reaproveitando os estilos do login

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function Register() {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [apiError, setApiError] = useState('')
  const navigate = useNavigate()

  function validateFields(): boolean {
    const newErrors: { [key: string]: string } = {}
    setApiError('')

    if (!name.trim()) newErrors.name = 'Informe seu nome completo'
    if (!cpf.trim()) newErrors.cpf = 'Informe seu CPF'
    else if (!isValidCpf(cpf)) newErrors.cpf = 'CPF inválido'

    if (!email.trim()) newErrors.email = 'Informe seu e-mail'
    else if (!isValidEmail(email)) newErrors.email = 'Digite um e-mail válido'

    if (!password) newErrors.password = 'Informe uma senha'
    else if (password.length < 8) newErrors.password = 'Senha deve ter pelo menos 8 caracteres'

    if (password !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validateFields()) return

    setIsLoading(true)
    setApiError('')

    try {
      await api.post('/auth/register', {
        name,
        email,
        cpf: unmask(cpf),
        password,
        role: 'OPERATOR' // Cadastro padrão pela web
      })
      alert('Conta criada com sucesso! Faça login.')
      navigate('/login')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao criar conta.'
      setApiError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (!password) return null
    if (password.length < 8) return { label: 'Fraca (mín. 8 caracteres)', color: '#ef4444' }
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 8) return { label: 'Forte', color: '#10b981' }
    return { label: 'Média', color: '#f59e0b' }
  }

  const strength = getPasswordStrength()

  return (
    <div className="login-container" style={{ padding: '2rem 0' }}>
      <div className="login-card" style={{ marginTop: '50px' }}>
        <header className="login-header">
          <h1 className="login-logo">TrackGo</h1>
          <p className="login-title">Criar Conta</p>
          <p className="login-subtitle">Junte-se à nossa plataforma</p>
        </header>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {apiError && (
            <div className="error-alert" role="alert">
              <AlertIcon />
              <span>{apiError}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name">Nome Completo</label>
            <div className="input-wrapper">
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João da Silva"
                disabled={isLoading}
                className={errors.name ? 'input-error' : ''}
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="cpf">CPF</label>
            <div className="input-wrapper">
              <input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                disabled={isLoading}
                className={errors.cpf ? 'input-error' : ''}
                maxLength={14}
              />
            </div>
            {errors.cpf && <span className="field-error">{errors.cpf}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                className={errors.email ? 'input-error' : ''}
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={`has-toggle ${errors.password ? 'input-error' : ''}`}
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
            {strength && (
              <span style={{ color: strength.color, fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                Força da senha: {strength.label}
              </span>
            )}
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={`has-toggle ${errors.confirmPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading || (password.length > 0 && password.length < 8)}>
            {isLoading ? 'Criando conta...' : 'Cadastrar'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/login" className="forgot-password-link">
              Já tem conta? Fazer Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
