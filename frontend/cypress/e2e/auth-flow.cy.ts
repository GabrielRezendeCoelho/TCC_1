describe('TrackGo - Fluxos Operacionais E2E (Login e Rotas)', () => {
  
  beforeEach(() => {
    // Restaura o localStorage
    cy.clearLocalStorage();
  });

  it('Não deve permitir acesso em rota protegida quando deslogado (Redirecionamento)', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('Deve mostrar mensagem de erro com credenciais inválidas', () => {
    cy.visit('/login');

    cy.get('input[type="email"]').type('fake@email.com');
    cy.get('input[type="password"]').type('111111');
    cy.get('button[type="submit"]').click();

    // Como é E2E, se a API interceptar 401 ela volta 'Erro ao realizar login' no toast/label
    cy.contains(/erro/i).should('be.visible');
  });

  it('Deve logar o usuário com sucesso e apresentar Painel Operacional', () => {
    // Necessita do backend rodando e da seed db push aplicada
    cy.visit('/login');

    cy.get('input[type="email"]').type('admin@trackgo.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();

    // Redireciona pro dashboard
    cy.url().should('not.include', '/login');
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Pacotes').should('be.visible');
  });

  it('Deve deslogar o admin com sucesso', () => {
    // Step: Login primeiro (Mocando o token direto pra acelerar Cypress)
    cy.window().then((window) => {
      window.localStorage.setItem('trackgo_token', 'fake.jwt.token');
      // Mock do request profile
      cy.intercept('GET', '/api/auth/profile', {
        statusCode: 200,
        body: { data: { id: 'user', name: 'Admin TrackGo', role: 'ADMIN' } }
      });
    });

    cy.visit('/');
    cy.contains('Admin TrackGo').should('be.visible');

    // Aciona O Logout na UI pelo ID mapeado
    cy.get('#logout-button').click();

    // Redireciona
    cy.url().should('include', '/login');
  });
});
