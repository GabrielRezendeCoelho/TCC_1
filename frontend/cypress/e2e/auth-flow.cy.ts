/// <reference types="cypress" />

describe('TrackGo - Fluxos Operacionais E2E (Login e Rotas)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('Não deve permitir acesso em rota protegida quando deslogado (Redirecionamento)', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
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
})
