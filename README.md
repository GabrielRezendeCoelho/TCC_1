# TCC Monorepo

Este projeto contém a arquitetura central de uma aplicação modular separada por responsabilidades, possuindo uma API Rest com [NestJS](https://nestjs.com/), um Frontend Administrativo Web com [Vite + React](https://vitejs.dev/) e um Aplicativo Móvel com [Expo (React Native)](https://expo.dev/).

## Estrutura do Projeto

- `/docs`: Documentação geral de sistemas, endpoints e regras de negócio.
- `/backend`: Lógica de Sistema construída sobre TypeScript Strict com Injeção de Dependências.
- `/frontend`: Painel de operações altamente reativo, SPA construído sobre o empacotador mais rápido, Vite.
- `/mobile`: Lógica do aplicativo e componentes compartilhados exportados nativamente.

## Comandos Chave

### Backend
- **Iniciar ambiente dev:** Executar `npm run start:dev` em `/backend`
- **Lint/Formatação:** `npm run lint` ou `npm run format`

### Frontend Web
- **Iniciar ambiente dev:** Executar `npm run dev` em `/frontend`
- **Lint/Formatação:** `npm run lint` ou `npm run format`

### Mobile
- **Iniciar ambiente dev/Expo:** Executar `npm start` em `/mobile`
- **Lint/Formatação:** `npm run lint` ou `npm run format`
