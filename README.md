# Pinata

### 🇺🇸 - Description

Pinata is a Web3 social protocol and prototype that turns each comment into a lightweight economic action. It combines community discussion, creator rewards, and an interactive prize pool flow to reduce spam and elevate high-value engagement.

This project is a social media-inspired interface built with Next.js and mock data, showcasing the product concept behind a paid-comment ecosystem. It includes feed browsing, vote interactions, activity tracking, profile views, and a Piñata Pool mechanic for rewarding active contributors.

## Overview

Pinata reimagines online conversations by introducing a low-fee micro-transaction for each public comment. Instead of allowing spam and low-quality noise to dominate the experience, the platform adds a symbolic cost that:

- filters low-value participation,
- supports creators through fee distribution,
- contributes to a rotating prize pool,
- encourages stronger community quality.

The prototype emphasizes the UX of a social app without requiring a full blockchain backend. It uses realistic mock content and local client state to simulate interactions and payouts.

## Core features

- Home feed with trending content and protocol highlights
- Trending posts page with sorting controls
- Personalized Me profile route
- Public profile pages for other users
- Shared vote state across all posts
- Paid comment interactions with a minimum SOL threshold
- Piñata Pool display with progress tracking and countdown
- Notifications center with unread counter
- Vote ordering and tie-break behavior in the trending feed
- Progress bars normalized to 0–100% range

## Application structure

- app/: Next.js App Router pages and layout
- components/: reusable UI blocks like cards, profile views, nav, and modal interactions
- data/mockData.ts: mock users, posts, comments, and winners
- utils/: sorting, relative time, pinata-calculation, and global social state logic
- interface/: shared TypeScript models for posts, comments, and profiles

## Local setup

1. Open the front-end folder:

   ```bash
   cd pinata_front
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the app in your browser at:

   http://localhost:3000

## Scripts

- npm run dev: runs the app locally
- npm run build: builds the production bundle
- npm run lint: validates code quality and warnings

## Product behavior

The app models a SocialFi experience where:

- comments require a minimum payment,
- vote balance affects trending position,
- valid comments contribute to a user’s Piñata progress,
- winner history appears in profile views,
- the user’s own profile can burst the Piñata when the progress threshold is reached.

## Design language

The interface a modern card layout with strong emphasis on engagement metrics, creator distribution, and community participation. The UI is intended to feel like a polished social product prototype, not a raw blockchain dashboard.

## Notes

This project uses mock data to simulate interaction flows and showcase the protocol concept in a hackathon-ready product demo.



# Pinata

### 🇧🇷 - Descrição

Pinata é um protocolo social Web3 e um protótipo que transforma cada comentário em uma ação econômica de baixo custo. A plataforma combina discussões da comunidade, recompensas para criadores e um fluxo interativo de premiação (prize pool) para reduzir o spam e promover um engajamento de alto valor.

Este projeto é uma interface inspirada em redes sociais, desenvolvida com Next.js e dados simulados (*mock data*), que demonstra o conceito de um ecossistema de comentários pagos. Ele inclui navegação no feed, interações de votação, rastreamento de atividades, visualização de perfis e uma mecânica de "Piñata Pool" para recompensar colaboradores ativos.

## Visão Geral

Pinata reinventa as conversas online ao introduzir uma microtransação de baixo custo para cada comentário público. Em vez de permitir que o spam e ruídos de baixa qualidade dominem a experiência, a plataforma adiciona um custo simbólico que:

- filtra participações de baixo valor,
- apoia criadores por meio da distribuição de taxas,
- contribui para um fundo de premiação rotativo,
- incentiva uma comunidade de maior qualidade.

O protótipo enfatiza a experiência do usuário (UX) de um aplicativo social sem exigir um backend completo em blockchain. Ele utiliza conteúdo simulado realista e estado local do cliente para simular interações e pagamentos. ## Principais funcionalidades

- Feed inicial com conteúdo em alta e destaques do protocolo
- Página de posts em alta com controles de ordenação
- Rota de perfil pessoal ("Me")
- Páginas de perfil público para outros usuários
- Estado de votação compartilhado entre todos os posts
- Interações de comentários pagos com valor mínimo em SOL
- Exibição do Piñata Pool com acompanhamento de progresso e contagem regressiva
- Central de notificações com contador de mensagens não lidas
- Lógica de ordenação de votos e desempate no feed de alta
- Barras de progresso normalizadas para o intervalo de 0 a 100%

## Estrutura da aplicação

- app/: Páginas e layout do App Router do Next.js
- components/: Blocos de interface reutilizáveis, como cards, visualizações de perfil, navegação e modais
- data/mockData.ts: Dados fictícios (mock) de usuários, posts, comentários e vencedores
- utils/: Lógica de ordenação, tempo relativo, cálculos da Piñata e estado social global
- interface/: Modelos TypeScript compartilhados para posts, comentários e perfis

## Configuração local

1. Abra a pasta do front-end:

```bash
cd pinata_front
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra o aplicativo no seu navegador em:

http://localhost:3000

## Scripts

- npm run dev: executa o aplicativo localmente
- npm run build: gera o pacote de produção
- npm run lint: valida a qualidade do código e verifica avisos

## Comportamento do produto

O aplicativo simula uma experiência SocialFi onde:

- comentários exigem um pagamento mínimo,
- o saldo de votos afeta a posição no ranking de alta,
- comentários válidos contribuem para o progresso da Piñata do usuário,
- o histórico de vencedores aparece nas visualizações de perfil,
- o próprio perfil do usuário pode estourar a Piñata quando o limite de progresso é atingido.

## Linguagem de design

A interface utiliza um layout moderno baseado em cards, com forte ênfase em métricas de engajamento, distribuição para criadores e participação da comunidade. A UI foi projetada para transmitir a sensação de um protótipo de produto social refinado, e não de um painel técnico de blockchain. ## Notas

Este projeto utiliza dados fictícios para simular fluxos de interação e apresentar o conceito do protocolo em uma demonstração de produto pronta para hackathon.