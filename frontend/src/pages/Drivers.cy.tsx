import React from 'react'
import { Drivers } from './Drivers'

describe('<Drivers />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<Drivers />)
  })
})