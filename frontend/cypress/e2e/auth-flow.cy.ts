/// <reference types="cypress" />

describe('TrackGo - Fluxos Operacionais E2E (Login e Rotas)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('Não deve permitir acesso em rota protegida quando deslogado (Redirecionamento)', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })

  it('Deve validar os campos obrigatórios e o formato do e-mail', () => {
    cy.visit('/login')

    // Tentar submeter sem preencher nada
    cy.get('button[type="submit"]').click()

    // Deve validar e-mail e senha vazios exibindo erros abaixo dos inputs
    cy.contains('Informe seu e-mail').should('be.visible')
    cy.contains('Informe sua senha').should('be.visible')

    // Digitar e-mail em formato inválido
    cy.get('input[type="email"]').type('email-invalido')
    cy.get('input[type="password"]').type('123456')
    cy.get('button[type="submit"]').click()

    // Deve validar o formato do e-mail
    cy.contains('Digite um e-mail válido').should('be.visible')
  })

  it('Deve mostrar mensagem de erro com credenciais inválidas', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('loginFail')

    cy.visit('/login')

    cy.get('input[type="email"]').type('fake@email.com')
    cy.get('input[type="password"]').type('111111')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginFail')

    cy.contains(/E-mail ou senha inválidos/i).should('be.visible')
  })

  it('Deve logar o usuário com sucesso e apresentar Painel Operacional', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          accessToken: 'fake.jwt.token',
          user: {
            id: 'admin-id',
            name: 'Admin TrackGo',
            email: 'admin@trackgo.com',
            role: 'ADMIN',
          },
        },
      },
    }).as('loginSuccess')

    cy.visit('/login')

    cy.get('input[type="email"]').type('admin@trackgo.com')
    cy.get('input[type="password"]').type('123456')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginSuccess')

    cy.url().should('not.include', '/login')
    cy.contains('Dashboard').should('be.visible')
  })

  it('Deve deslogar o admin com sucesso', () => {
    cy.intercept('GET', '**/api/auth/profile', {
      statusCode: 200,
      body: {
        data: { id: 'user', name: 'Admin TrackGo', role: 'ADMIN' },
      },
    }).as('getProfile')

    cy.intercept('GET', '**/api/packages*', { statusCode: 200, body: { data: [], total: 0 } })
    cy.intercept('GET', '**/api/drivers*', { statusCode: 200, body: { data: [], total: 0 } })
    cy.intercept('GET', '**/api/routes*', { statusCode: 200, body: { data: [], total: 0 } })

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('@TrackGo:token', 'fake.jwt.token')
        win.localStorage.setItem(
          '@TrackGo:user',
          JSON.stringify({
            id: 'user',
            name: 'Admin TrackGo',
            email: 'admin@trackgo.com',
            role: 'ADMIN',
          }),
        )
      },
    })

    cy.contains('Admin TrackGo').should('be.visible')

    cy.get('#logout-button').click()

    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', '@TrackGo:token').should('be.null')
  })

  it('Deve fazer o login com sucesso e, em seguida, fazer o logout no mesmo fluxo', () => {
    // 1. Interceptar chamadas de API
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        data: {
          accessToken: 'fake.jwt.token',
          user: {
            id: 'admin-id',
            name: 'Admin TrackGo',
            email: 'admin@trackgo.com',
            role: 'ADMIN',
          },
        },
      },
    }).as('loginSuccess')

    cy.intercept('GET', '**/api/auth/profile', {
      statusCode: 200,
      body: {
        data: { id: 'admin-id', name: 'Admin TrackGo', role: 'ADMIN' },
      },
    }).as('getProfile')

    cy.intercept('GET', '**/api/packages*', { statusCode: 200, body: { data: [], total: 0 } })
    cy.intercept('GET', '**/api/drivers*', { statusCode: 200, body: { data: [], total: 0 } })
    cy.intercept('GET', '**/api/routes*', { statusCode: 200, body: { data: [], total: 0 } })

    // 2. Visitar página de login
    cy.visit('/login')

    // 3. Preencher credenciais e submeter
    cy.get('input[type="email"]').type('admin@trackgo.com')
    cy.get('input[type="password"]').type('123456')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginSuccess')

    // 4. Verificar se redirecionou para o dashboard logado
    cy.url().should('not.include', '/login')
    cy.contains('Dashboard').should('be.visible')
    cy.contains('Admin TrackGo').should('be.visible')

    // 5. Clicar em Sair (Logout)
    cy.get('#logout-button').click()

    // 6. Verificar se voltou para o Login e limpou o localStorage
    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', '@TrackGo:token').should('be.null')
  })
})
