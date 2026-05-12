<div align="center">

# 🚚 TrackGo

**Plataforma inteligente de logística com roteirização otimizada e rastreamento em tempo real**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> Trabalho de Conclusão de Curso — Sistema completo de gestão logística com roteirização inteligente, rastreamento de pacotes e comprovação digital de entregas.

</div>

---

## 📋 Sumário

1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Regra de Negócio Principal](#-regra-de-negócio-principal)
3. [Fluxo da Regra de Negócio (Draw.io)](#-fluxo-da-regra-de-negócio)
4. [Stack de Desenvolvimento](#-stack-de-desenvolvimento)
5. [Arquitetura do Sistema](#-arquitetura-do-sistema)
6. [Estrutura do Projeto (Monorepo)](#-estrutura-do-projeto-monorepo)
7. [Módulos do Backend](#-módulos-do-backend)
8. [Banco de Dados — Modelo de Domínio](#-banco-de-dados--modelo-de-domínio)
9. [Como Executar](#-como-executar)

---

## 🎯 Visão Geral do Projeto

**TrackGo** é uma plataforma SaaS de logística voltada para empresas de transporte e entrega de mercadorias. O sistema resolve um dos maiores desafios operacionais do setor: **a ineficiência no planejamento manual de rotas**, que resulta em alto consumo de combustível, atrasos e baixa satisfação do cliente.

### Problema

Muitas transportadoras ainda planejam rotas manualmente ou com ferramentas genéricas (como planilhas), sem levar em conta a distância total percorrida, a sequência ideal de entregas ou a capacidade do veículo.

### Solução

O TrackGo oferece:
- **Roteirização inteligente** com algoritmo de otimização TSP (Travelling Salesman Problem) heurístico
- **Rastreamento em tempo real** com geolocalização dos pacotes
- **Comprovação digital de entrega** com foto e assinatura eletrônica
- **Painel web** para operadores gerenciarem toda a operação
- **App mobile** para motoristas receberem rotas e registrarem entregas
- **Auditoria completa** de todas as ações críticas do sistema

---

## 🧠 Regra de Negócio Principal

### Roteirização Inteligente e Ciclo de Entrega

A funcionalidade central do TrackGo é o **ciclo completo de roteirização e rastreamento de entregas**, descrito abaixo em quatro fases:

---

#### Fase 1 — Cadastro e Preparação

1. O **Operador** acessa o painel web e realiza autenticação via JWT (role `ADMIN` ou `OPERATOR`)
2. O operador **cadastra os pacotes** do dia informando: endereço de entrega, destinatário, peso, telefone e cliente associado
3. O sistema **geocodifica automaticamente** o endereço de cada pacote (converte endereço textual em coordenadas lat/lng via Google Maps API)
4. O operador **cria uma nova Rota**, selecionando os pacotes do dia e o motorista responsável
5. A rota é salva inicialmente com status `DRAFT`

---

#### Fase 2 — Otimização de Rota ⭐ (Núcleo da Regra de Negócio)

1. O operador clica em **"Otimizar Rota"** (`POST /routes/:id/optimize`)
2. O sistema executa o **algoritmo Nearest Neighbor** (heurística do vizinho mais próximo para o problema do caixeiro viajante):
   - Parte do endereço base do motorista (ponto de origem)
   - A cada iteração, seleciona a parada **mais próxima ainda não visitada**
   - Repete até esgotar todas as paradas
   - Calcula a distância total e o tempo estimado
3. A ordem otimizada das paradas é armazenada como JSON no campo `optimizedOrder` da rota
4. O status da rota é atualizado para `OPTIMIZED`
5. O motorista é **notificado** que a rota está disponível no app

> **Impacto mensurável:** O algoritmo de vizinho mais próximo, mesmo sendo uma heurística, reduz tipicamente entre 15% e 30% a distância total percorrida em comparação ao planejamento manual aleatório.

---

#### Fase 3 — Execução pelo Motorista (App Mobile)

1. O **Motorista** acessa o app mobile com sua conta (role `DRIVER`)
2. Visualiza as rotas atribuídas a ele com as paradas já em ordem otimizada
3. Ao iniciar a jornada, o status da rota muda para `IN_PROGRESS`
4. Para cada entrega, o sistema registra **eventos de rastreamento** com status, localização e timestamp
5. Ao concluir cada entrega:
   - **Sucesso:** registra `DeliveryProof` com foto, assinatura e nome do recebedor → pacote vai para `DELIVERED`
   - **Falha:** registra uma `Occurrence` com severidade e descrição → pacote vai para `FAILED` ou `RETURNED`

---

#### Fase 4 — Rastreamento e Auditoria

1. O **Cliente** pode consultar o status de qualquer pacote pelo código de rastreio
2. O **Operador** monitora o dashboard em tempo real: pacotes entregues, em rota, com ocorrência
3. Toda ação crítica gera um **AuditLog** imutável (quem fez, o quê, quando, em qual entidade)
4. Ao final, o operador visualiza o relatório consolidado da operação

---

## 📊 Fluxo da Regra de Negócio

O diagrama completo do fluxo de negócio está disponível em formato **draw.io** (`.drawio`) no diretório `/docs`:

```
docs/
└── fluxo-regra-negocio.drawio   ← Abrir com draw.io (app.diagrams.net)
```

> Para visualizar: acesse [app.diagrams.net](https://app.diagrams.net), clique em **"Open from device"** e selecione o arquivo `docs/fluxo-regra-negocio.drawio`.

O fluxo possui **4 swim lanes** representando os atores do sistema:

| Swim Lane | Ator | Cor |
|---|---|---|
| OPERADOR (Painel Web) | Gerencia pacotes, rotas e monitora operação | Azul |
| SISTEMA (API NestJS) | Processa regras, persiste dados, executa algoritmo | Verde |
| MOTORISTA (App Mobile) | Recebe rota, executa entregas, registra provas | Amarelo |
| CLIENTE (Rastreamento) | Consulta status do pacote via código | Rosa |

---

## 🛠️ Stack de Desenvolvimento

### Backend — API REST

| Tecnologia | Versão | Finalidade |
|---|---|---|
| **NestJS** | v10+ | Framework Node.js para construção da API REST com suporte nativo a DI, módulos e decorators |
| **TypeScript** | v5+ | Tipagem estática estrita para segurança e manutenibilidade do código |
| **Prisma ORM** | v6+ | Mapeamento objeto-relacional, migrations e acesso ao banco de dados |
| **PostgreSQL** | v16 | Banco de dados relacional robusto para persistência de todos os domínios |
| **JWT (Passport)** | — | Autenticação stateless com tokens, roles e guards de autorização |
| **class-validator** | — | Validação de DTOs com decorators (pipes de validação do NestJS) |
| **Docker** | — | Containerização do banco de dados para ambiente de desenvolvimento local |

### Frontend Web — Painel Administrativo

| Tecnologia | Versão | Finalidade |
|---|---|---|
| **Vite** | v5+ | Build tool ultrarrápido com HMR (Hot Module Replacement) |
| **React** | v18+ | Biblioteca de UI baseada em componentes reativos |
| **TypeScript** | v5+ | Tipagem completa do frontend, incluindo DTOs e responses da API |
| **React Router** | v6+ | Roteamento client-side (SPA) com proteção de rotas por role |
| **Axios** | — | Cliente HTTP com interceptors para token JWT e tratamento de erros |
| **Cypress** | — | Testes End-to-End para validação de fluxos críticos |
| **Vitest** | — | Testes unitários rápidos baseados em Vite |

### Mobile — App para Motoristas

| Tecnologia | Versão | Finalidade |
|---|---|---|
| **Expo** | SDK 51+ | Framework React Native com ferramentas de desenvolvimento simplificadas |
| **React Native** | v0.74+ | Renderização nativa de componentes iOS e Android |
| **React Navigation** | v6+ | Navegação entre telas (Stack + Tab Navigator) |
| **Expo Location** | — | Acesso à geolocalização do dispositivo para rastreamento em tempo real |
| **Expo Camera** | — | Captura de foto como prova de entrega |
| **Expo Secure Store** | — | Armazenamento seguro do JWT token no dispositivo |

### Infraestrutura e DevOps

| Tecnologia | Finalidade |
|---|---|
| **Docker + Docker Compose** | Orquestração local do banco PostgreSQL |
| **GitHub** | Controle de versão, PR reviews e CI/CD |
| **ESLint + Prettier** | Padronização de código em todos os módulos |

---

## 🏗️ Arquitetura do Sistema

### Arquitetura Escolhida: **Monorepo Modular com Arquitetura em Camadas (Layered Architecture)**

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                             │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │   Painel Web (SPA)  │    │   App Mobile (Expo RN)   │   │
│  │   Vite + React      │    │   React Native           │   │
│  └──────────┬──────────┘    └───────────┬──────────────┘   │
└─────────────┼─────────────────────────┼────────────────────┘
              │        HTTPS / REST      │
              ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (NestJS)                      │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │  Auth Guard  │  │ Role Guard  │  │ Validation Pipe   │  │
│  │  (JWT)       │  │ (RBAC)      │  │ (class-validator) │  │
│  └──────────────┘  └─────────────┘  └───────────────────┘  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Routes  │ │ Packages │ │ Tracking │ │  Dashboard   │  │
│  │  Module  │ │  Module  │ │  Module  │ │    Module    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Prisma ORM (Database Layer)             │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   PostgreSQL 16          │
              │   (Docker Container)     │
              └─────────────────────────┘
```

### Padrão Interno do Backend: **Controller → Service → Repository (via Prisma)**

Cada módulo do NestJS segue a separação em camadas:

```
[HTTP Request]
      │
      ▼
┌──────────────────┐
│   Controller     │  ← Recebe a requisição, valida DTO, chama Service
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Service       │  ← Contém a lógica de negócio pura
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Prisma Client   │  ← Acessa o banco PostgreSQL
└──────────────────┘
```

### Por que essa Arquitetura?

#### 1. **Monorepo** — Coesão sem acoplamento
Manter `backend`, `frontend` e `mobile` em um único repositório facilita:
- **Compartilhamento de tipos** (TypeScript interfaces/DTOs consistentes entre os módulos)
- **Revisões de código unificadas** (um PR cobre mudanças em toda a stack)
- **Padronização de qualidade** (ESLint, Prettier, EditorConfig únicos)
- **Rastreabilidade** (uma feature branch cobre backend + frontend + mobile)

#### 2. **Arquitetura em Camadas no Backend (NestJS)**
O NestJS força naturalmente a separação de responsabilidades via:
- **Módulos** com escopo próprio e injeção de dependências declarativa
- **Controllers** como ponto de entrada HTTP sem lógica de negócio
- **Services** como camada de domínio testável de forma isolada
- **Guards e Interceptors** como crosscutting concerns centralizados

Isso resulta em código **altamente testável**, pois cada camada pode ser mockada independentemente.

#### 3. **Prisma ORM** — Type-safety no banco de dados
O Prisma gera um cliente TypeScript a partir do schema, garantindo:
- Tipos exatos para todas as queries (sem erros de campo em runtime)
- Migrations controladas por versão (rastreáveis no Git)
- Queries compostas e performáticas com uma API fluente

#### 4. **React (Web) + React Native (Mobile)**
O compartilhamento da mesma linguagem, paradigma (componentes) e ecossistema (hooks, context) entre web e mobile reduz:
- **Curva de aprendizado** (um desenvolvedor cobre ambas as plataformas)
- **Tempo de desenvolvimento** (padrões e utilitários reutilizáveis)

---

## 📁 Estrutura do Projeto (Monorepo)

```
TCC/                                     ← Raiz do Monorepo
├── .editorconfig                        ← Configuração de editor unificada
├── .gitignore                           ← Arquivos ignorados pelo Git
├── docker-compose.yml                   ← Serviço PostgreSQL via Docker
├── README.md                            ← Este arquivo de documentação
│
├── docs/                                ← Documentação do projeto
│   └── fluxo-regra-negocio.drawio      ← Diagrama da regra de negócio
│
├── backend/                             ← API REST (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma                ← Modelo de domínio e migrations
│   │   ├── seed.ts                      ← Dados iniciais para desenvolvimento
│   │   └── migrations/                  ← Histórico de migrations do banco
│   ├── src/
│   │   ├── main.ts                      ← Bootstrap da aplicação NestJS
│   │   ├── app.module.ts                ← Módulo raiz (importa todos os módulos)
│   │   ├── app.controller.ts            ← Health check e rota raiz
│   │   ├── config/                      ← Configurações da aplicação (env, cors, etc.)
│   │   ├── common/
│   │   │   ├── decorators/              ← Decorators customizados (@CurrentUser, etc.)
│   │   │   ├── filters/                 ← Exception filters globais
│   │   │   ├── guards/                  ← Guards de autenticação e autorização
│   │   │   ├── interceptors/            ← Interceptors (logging, response transform)
│   │   │   └── pipes/                   ← Pipes de validação e transformação
│   │   └── modules/
│   │       ├── auth/                    ← Autenticação JWT + estratégias Passport
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts   ← POST /auth/login, POST /auth/refresh
│   │       │   ├── auth.service.ts
│   │       │   ├── dto/                 ← LoginDto, TokenDto
│   │       │   ├── guards/              ← JwtAuthGuard, RolesGuard
│   │       │   └── strategies/          ← JwtStrategy (Passport)
│   │       ├── users/                   ← CRUD de usuários (ADMIN only)
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts  ← GET/POST/PATCH/DELETE /users
│   │       │   ├── users.service.ts
│   │       │   └── dto/                 ← CreateUserDto, UpdateUserDto
│   │       ├── clients/                 ← Cadastro e gestão de clientes
│   │       │   ├── clients.module.ts
│   │       │   ├── clients.controller.ts
│   │       │   ├── clients.service.ts
│   │       │   └── dto/
│   │       ├── drivers/                 ← Cadastro e gestão de motoristas
│   │       │   ├── drivers.module.ts
│   │       │   ├── drivers.controller.ts
│   │       │   ├── drivers.service.ts
│   │       │   └── dto/
│   │       ├── vehicles/                ← Frota de veículos
│   │       │   ├── vehicles.module.ts
│   │       │   ├── vehicles.controller.ts
│   │       │   ├── vehicles.service.ts
│   │       │   └── dto/
│   │       ├── packages/                ← Cadastro e rastreamento de pacotes
│   │       │   ├── packages.module.ts
│   │       │   ├── packages.controller.ts  ← GET/POST /packages + tracking público
│   │       │   ├── packages.service.ts
│   │       │   └── dto/
│   │       ├── routes/                  ← ⭐ Módulo central: roteirização
│   │       │   ├── routes.module.ts
│   │       │   ├── routes.controller.ts ← POST /routes/:id/optimize
│   │       │   ├── routes.service.ts
│   │       │   ├── services/
│   │       │   │   └── route-optimizer.service.ts  ← Algoritmo TSP Nearest Neighbor
│   │       │   └── dto/
│   │       ├── tracking/                ← Registro de eventos de rastreamento
│   │       │   ├── tracking.module.ts
│   │       │   ├── tracking.controller.ts  ← POST /tracking
│   │       │   ├── tracking.service.ts
│   │       │   └── dto/
│   │       ├── delivery-proofs/         ← Comprovação digital de entrega
│   │       │   ├── delivery-proofs.module.ts
│   │       │   ├── delivery-proofs.controller.ts
│   │       │   ├── delivery-proofs.service.ts
│   │       │   └── dto/
│   │       ├── occurrences/             ← Registro de falhas e ocorrências
│   │       │   ├── occurrences.module.ts
│   │       │   ├── occurrences.controller.ts
│   │       │   ├── occurrences.service.ts
│   │       │   └── dto/
│   │       ├── dashboard/               ← KPIs e métricas operacionais
│   │       │   ├── dashboard.module.ts
│   │       │   ├── dashboard.controller.ts  ← GET /dashboard
│   │       │   ├── dashboard.service.ts
│   │       │   └── dto/
│   │       └── audit-logs/              ← Auditoria imutável de ações críticas
│   │           ├── audit-logs.module.ts
│   │           ├── audit-logs.controller.ts
│   │           ├── audit-logs.service.ts
│   │           └── dto/
│   ├── test/                            ← Testes E2E (Supertest + Jest)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                            ← Painel Administrativo Web (Vite + React)
│   ├── cypress/                         ← Testes End-to-End
│   │   ├── e2e/                         ← Specs de features
│   │   └── support/                     ← Comandos customizados e Page Objects
│   ├── src/
│   │   ├── main.tsx                     ← Entry point da SPA
│   │   ├── App.tsx                      ← Configuração de rotas React Router
│   │   ├── index.css                    ← Estilos globais e design tokens
│   │   ├── components/
│   │   │   ├── layout/                  ← Sidebar, Header, PageWrapper
│   │   │   ├── ui/                      ← Componentes base (Button, Modal, Badge)
│   │   │   ├── forms/                   ← Formulários de cadastro reutilizáveis
│   │   │   └── charts/                  ← Gráficos e visualizações do dashboard
│   │   ├── pages/
│   │   │   ├── Login.tsx                ← Tela de autenticação
│   │   │   ├── Dashboard.tsx            ← Visão geral operacional (KPIs)
│   │   │   ├── Packages.tsx             ← Gestão de pacotes
│   │   │   ├── Routes.tsx               ← Gestão e otimização de rotas ⭐
│   │   │   ├── Drivers.tsx              ← Gestão de motoristas
│   │   │   └── Users.tsx                ← Gestão de usuários (ADMIN)
│   │   ├── services/                    ← Clientes Axios por domínio (api.ts, etc.)
│   │   ├── contexts/                    ← AuthContext, ThemeContext
│   │   ├── hooks/                       ← Custom hooks (useAuth, useFetch, etc.)
│   │   ├── types/                       ← Interfaces TypeScript dos domínios
│   │   └── utils/                       ← Funções utilitárias (formatDate, etc.)
│   ├── package.json
│   └── vite.config.ts
│
└── mobile/                              ← App Mobile (Expo + React Native)
    ├── App.tsx                          ← Entry point do app
    ├── app.json                         ← Configuração Expo
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.tsx           ← Autenticação do motorista
    │   │   ├── RouteListScreen.tsx       ← Lista de rotas atribuídas
    │   │   └── RouteDetailScreen.tsx     ← Detalhes da rota + execução de entregas ⭐
    │   ├── components/                  ← Componentes visuais RN reutilizáveis
    │   ├── navigation/                  ← Configuração do React Navigation
    │   ├── services/                    ← Clientes HTTP para a API
    │   ├── contexts/                    ← AuthContext (JWT storage seguro)
    │   ├── hooks/                       ← useLocation, useAuth, etc.
    │   ├── types/                       ← Tipos TypeScript compartilhados
    │   └── utils/                       ← Helpers de formatação e geolocalização
    └── package.json
```

---

## 📦 Módulos do Backend

| Módulo | Descrição | Endpoints Principais |
|---|---|---|
| **auth** | Autenticação JWT, login, refresh token | `POST /auth/login` |
| **users** | CRUD de usuários com roles | `GET/POST/PATCH/DELETE /users` |
| **clients** | Cadastro de clientes (CPF/CNPJ) | `GET/POST/PATCH /clients` |
| **drivers** | Gestão de motoristas (CNH) | `GET/POST/PATCH /drivers` |
| **vehicles** | Frota de veículos com capacidade | `GET/POST/PATCH /vehicles` |
| **packages** | ⭐ Cadastro, geocodificação e rastreamento | `GET/POST /packages`, `GET /packages/:code/tracking` |
| **routes** | ⭐⭐ Criação e **otimização** de rotas | `POST /routes`, `POST /routes/:id/optimize` |
| **tracking** | Eventos de rastreamento em tempo real | `POST /tracking`, `GET /tracking/:packageId` |
| **delivery-proofs** | Comprovação digital de entrega | `POST /delivery-proofs` |
| **occurrences** | Registro de falhas na entrega | `GET/POST /occurrences` |
| **dashboard** | KPIs e métricas operacionais | `GET /dashboard` |
| **audit-logs** | Auditoria imutável de ações | `GET /audit-logs` |

---

## 🗄️ Banco de Dados — Modelo de Domínio

```
User ──────┬──── Driver ────── Vehicle
           └──── Client ────── Package ────┬── Tracking (eventos)
                                           ├── DeliveryProof
                                           └── Occurrence

Route ─────┬──── Driver
           ├──── Package[] (many)
           └──── Occurrence[]

AuditLog ──── User (nullable)
```

**Enums de Status:**

| Entidade | Status Possíveis |
|---|---|
| **Route** | `DRAFT` → `OPTIMIZED` → `IN_PROGRESS` → `COMPLETED` |
| **Package** | `PENDING` → `IN_ROUTE` → `DELIVERED` / `RETURNED` / `FAILED` |
| **DeliveryProof** | `SUCCESS` / `FAILED` |
| **Occurrence** | Severidade: `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js v20+
- Docker Desktop
- Expo Go (para mobile)

### 1. Banco de Dados

```bash
# Na raiz do projeto
docker-compose up -d
```

### 2. Backend

```bash
cd backend

# Configurar variáveis de ambiente
cp .env.example .env

# Instalar dependências
npm install

# Executar migrations do banco
npx prisma migrate dev

# Opcional: popular banco com dados de seed
npx prisma db seed

# Iniciar em modo desenvolvimento
npm run start:dev
```

> API disponível em: `http://localhost:3000`

### 3. Frontend Web

```bash
cd frontend
npm install
npm run dev
```

> Painel disponível em: `http://localhost:5173`

### 4. App Mobile

```bash
cd mobile
npm install
npm start
```

> Escanear o QR Code com o Expo Go no dispositivo

---

<div align="center">

**TCC — Sistemas de Informação**  
Desenvolvido com ❤️ usando TypeScript full-stack

</div>
