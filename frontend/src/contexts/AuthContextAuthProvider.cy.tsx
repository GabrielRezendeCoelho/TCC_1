import React from 'react'
import { AuthProvider } from './AuthContext'

describe('<AuthProvider />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<AuthProvider />)
  })
})