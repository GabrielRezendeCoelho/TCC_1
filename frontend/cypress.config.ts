import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false, // desativado para testes mais rápidos
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
