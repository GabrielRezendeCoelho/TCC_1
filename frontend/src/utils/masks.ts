/**
 * Aplica máscara de CPF (999.999.999-99)
 */
export const maskCpf = (value: string) => {
  return value
    .replace(/\D/g, '') // remove tudo que não for número
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1') // impede mais de 11 números
}

/**
 * Valida um CPF (cálculo matemático dos dígitos verificadores)
 */
export const isValidCpf = (cpf: string) => {
  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cleanCpf)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false

  return true
}

/**
 * Aplica máscara de CNPJ (99.999.999/9999-99)
 */
export const maskCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1') // impede mais de 14 números
}

/**
 * Aplica máscara de Documento (CPF ou CNPJ dinamicamente)
 */
export const maskDocument = (value: string) => {
  const cleanValue = value.replace(/\D/g, '')
  if (cleanValue.length <= 11) {
    return maskCpf(value)
  } else {
    return maskCnpj(value)
  }
}

/**
 * Aplica máscara de Telefone ((99) 99999-9999 ou (99) 9999-9999)
 */
export const maskPhone = (value: string) => {
  let cleanValue = value.replace(/\D/g, '')

  if (cleanValue.length > 11) {
    cleanValue = cleanValue.substring(0, 11)
  }

  if (cleanValue.length === 0) return ''
  if (cleanValue.length <= 2) return `(${cleanValue}`
  if (cleanValue.length <= 6) return `(${cleanValue.substring(0, 2)}) ${cleanValue.substring(2)}`
  if (cleanValue.length <= 10)
    return `(${cleanValue.substring(0, 2)}) ${cleanValue.substring(2, 6)}-${cleanValue.substring(6)}`

  // 11 dígitos
  return `(${cleanValue.substring(0, 2)}) ${cleanValue.substring(2, 7)}-${cleanValue.substring(7)}`
}

/**
 * Aplica máscara de CEP (99999-999)
 */
export const maskCep = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1')
}

/**
 * Aplica máscara de Data (DD/MM/AAAA)
 */
export const maskDate = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\/\d{4})\d+?$/, '$1')
}

/**
 * Remove qualquer formatação (mantém apenas números)
 */
export const unmask = (value: string) => {
  return value.replace(/\D/g, '')
}
