import React from 'react'
import { Dashboard } from './Dashboard'

describe('<Dashboard />', () => {
  it('deve renderizar o componente com sucesso', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Dashboard />)
  })
})
