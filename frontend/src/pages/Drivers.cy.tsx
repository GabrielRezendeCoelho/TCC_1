import React from 'react'
import { Drivers } from './Drivers'

describe('<Drivers />', () => {
  it('deve renderizar o componente com sucesso', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Drivers />)
  })
})
