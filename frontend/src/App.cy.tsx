import React from 'react'
import App from './App'

describe('<App />', () => {
  it('deve renderizar o componente com sucesso', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<App />)
  })
})
