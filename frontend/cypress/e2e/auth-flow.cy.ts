/// <reference types="cypress" />

describe('TrackGo - Fluxos Operacionais E2E (Login e Rotas)', () => {
  beforeEach(() => {
    // Limpa o estado para garantir testes isolados
    cy.clearLocalStorage()
  })

  it('Não deve permitir acesso em rota protegida quando deslogado (Redirecionamento)', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })

  it('Deve mostrar mensagem de erro com credenciais inválidas', () => {
    // Mock do erro 401
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('loginFail')

    cy.visit('/login')

    cy.get('input[type="email"]').type('fake@email.com')
    cy.get('input[type="password"]').type('111111')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginFail')

    // Verifica a mensagem de erro amigável definida no componente React
    cy.contains(/E-mail ou senha inválidos/i).should('be.visible')
  })

  it('Deve logar o usuário com sucesso e apresentar Painel Operacional', () => {
    // Mock do sucesso no login
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

    // Deve redirecionar e mostrar elementos do Dashboard
    cy.url().should('not.include', '/login')
    cy.contains('Dashboard').should('be.visible')
  })

  it('Deve deslogar o admin com sucesso', () => {
    // Mock do profile para quando o app carregar
    cy.intercept('GET', '**/api/auth/profile', {
      statusCode: 200,
      body: {
        data: { id: 'user', name: 'Admin TrackGo', role: 'ADMIN' },
      },
    }).as('getProfile')

    // Injeta o estado de login diretamente no localStorage antes de visitar a página
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

    // Garante que o usuário está "logado" na UI
    cy.contains('Admin TrackGo').should('be.visible')

    // Aciona o Logout
    cy.get('#logout-button').click()

    // Deve limpar o estado e redirecionar para o login
    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', '@TrackGo:token').should('be.null')
  })
})
