<p align="center">
  <img src="pinata_front/public/pinataA.png" alt="Pinata logo" width="120" />
</p>

<h1 align="center">Pinata</h1>

<p align="center">
  <strong>Better conversations. Shared rewards.</strong><br />
  A SocialFi protocol, designed for Solana, where every comment is a small economic action.
</p>

<p align="center">
  <a href="https://pinata-zeta.vercel.app/">Live app</a> ·
  <a href="https://github.com/samirdourado/pinata">GitHub</a> ·
  <a href="https://www.youtube.com/watch?v=ev8Xz9rm4Nk">Pitch video</a> ·
  <a href="https://www.youtube.com/watch?v=Un_GRtISO6M">Demo video</a> ·
  <a href="#-português">Português</a>
</p>

> [!IMPORTANT]
> **Prototype status: real wallet connection, simulated payments.** The current MVP is a Next.js frontend. "Connect Wallet" connects a real Solana wallet (Phantom, Solflare, Backpack, Trust Wallet, or any other Wallet Standard wallet) through the Solana Wallet Adapter, on **Devnet**, and shows the wallet's real Devnet balance. **Comment fees, Piñata balances, and prizes are still simulated:** they are calculated locally in the browser, and the app does not request signatures or send transactions yet. Accounts and activity are stored in the browser's `localStorage`. The on-chain program is the next milestone (see [Roadmap](#roadmap)).

---

## 🇺🇸 English

### What is Pinata?

Social platforms are full of spam, bots, and low-effort replies, because commenting costs nothing. Creators generate the engagement, but platforms capture almost all of the value.

Pinata turns each public comment into a lightweight economic action:

- **Posting is free.** Anyone can start a conversation.
- **Commenting has a tiny fee**, starting at 0.005 SOL. The commenter chooses the value. This filters spam and bots and makes every reply deliberate.
- **The fee is shared** between the post creator, the platform, and the creator's Piñata. In the prototype, 40% of each comment fills the **Creator Piñata**.
- **The Creator Piñata** is a gamified prize pool on every profile. When it reaches **60%** of its target, the creator can **burst** it, and the balance goes to an eligible commenter from that round. A new round starts right after.
- **The Platform Piñata Pool**, funded by protocol fees, runs a monthly draw for active commenters.

Creators earn from conversation, commenters are rewarded for showing up, and quality wins over volume.

### What works today

| Area | Status |
| --- | --- |
| Account registration and sign-in (email or username) | ✅ Working, stored in `localStorage` |
| Personal dashboard (posts, paid comments, comment value, Piñata, rewards) | ✅ Working |
| Free posts, paid comments with a chosen value (min 0.005 SOL) | ✅ Working, payment **simulated** |
| Upvotes/downvotes and trending ranking | ✅ Working |
| Creator Piñata progress, 60% threshold, burst and winner history | ✅ Working, payout **simulated** |
| Platform Piñata Pool card with monthly countdown | ✅ UI with sample data |
| Profile editing and public profiles | ✅ Working |
| Persistence after refresh (accounts, posts, votes, comments, Piñata history) | ✅ Working in the same browser |
| Solana wallet connection (Wallet Adapter, Devnet) with real balance | ✅ Working, read-only (no signatures yet) |
| Supported wallets page (`/wallets`) with detection and Devnet faucet guide | ✅ Working |
| On-chain fees, Piñata vaults, and draws | ⏳ Roadmap |

### Blockchain and tools

- **Blockchain:** Solana Devnet. Wallets connect for real through the Solana Wallet Adapter and the app reads the wallet balance from a Devnet RPC; SOL payments are still simulated and nothing is written on-chain yet.
- **Solana libraries:** `@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`, `@solana/web3.js` (Wallet Standard detection, so EVM-only wallets are ignored)
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Validation:** Zod
- **Local auth:** Web Crypto API (salted PBKDF2-SHA-256 password hashes), `localStorage` sessions
- **Hosting:** Vercel
- **Containers:** Docker and Docker Compose (production image and development server)
- **Planned Solana stack:** Anchor program with PDAs for fee splits and Piñata vaults, verifiable randomness (e.g. Switchboard VRF) for fair draws, SPL tokens (USDC and community tokens), Solana Actions and Blinks for paid comments anywhere on the web

### Composability

Pinata is designed around Solana primitives, so each piece can plug into the wider ecosystem:

- **SPL tokens:** comment fees and prizes in SOL, USDC, or a creator's community token
- **PDAs:** one Piñata vault per creator, auditable by anyone
- **Verifiable randomness:** provably fair Piñata draws
- **Blinks / Solana Actions:** pay-to-comment from X, Discord, or any site that renders Blinks
- **Wallet Adapter:** any Solana wallet, no custom onboarding

### Go-to-market and business model

- **Revenue:** a small protocol share of every paid comment. Pinata only earns when conversations create value.
- **Beachhead:** Brazilian crypto communities, with Superteam Brasil, onboarding creators who already have engaged audiences (builders, educators, community leads).
- **Distribution:** creators bring their audiences; Blinks let paid comments live where audiences already are; the Piñata draws give commenters a reason to come back and invite others.
- **Expansion:** creators across Latin America, then any community that wants spam-free, rewarded discussion.
- **Demand validation (next steps):** pilot with a small group of Brazilian Solana creators on Devnet, measuring comment quality, repeat commenters, and creator earnings.

### Roadmap

1. ✅ Frontend MVP: feed, trending, profiles, paid comments, Creator Piñata, Platform Pool UI
2. ✅ Accounts: registration, sign-in, dashboard, local persistence
3. ✅ Real wallet connection with Solana Wallet Adapter on Devnet (address and balance)
4. ⏳ Anchor program on Devnet: comment payments, fee split, Piñata vaults in PDAs
5. ⏳ Verifiable randomness for Piñata and Platform Pool draws
6. ⏳ Backend accounts linked to wallets, Blinks for paid comments, USDC support
7. ⏳ Creator pilot in Brazil, then mainnet

### Team

- **Samir Dourado** ([@samirdourado](https://github.com/samirdourado)): founder, product, and full-stack development

Location: **Brazil** 🇧🇷

### Videos

The pitch and the demo are on YouTube, narrated in English with English subtitles. The video files are not stored in this repository. The `videos/` folder keeps the bilingual scripts, the subtitle files in English and Brazilian Portuguese, and the tooling that records and renders the videos (see [videos/README.md](videos/README.md)). The videos were recorded before the real wallet connection, so they show the earlier simulated wallet.

| Video | Watch | Script (EN and pt-BR) | Subtitles |
| --- | --- | --- | --- |
| Pitch (~2:45) | [YouTube](https://www.youtube.com/watch?v=ev8Xz9rm4Nk) | [pitch-video-script.md](videos/pitch-video-script.md) | [EN](videos/pitch-video-en.srt) · [pt-BR](videos/pitch-video-pt-BR.srt) |
| Demo (~2:45) | [YouTube](https://www.youtube.com/watch?v=Un_GRtISO6M) | [demo-video-script.md](videos/demo-video-script.md) | [EN](videos/demo-video-en.srt) · [pt-BR](videos/demo-video-pt-BR.srt) |

### Repository structure

```text
pinata/
├── compose.yaml    Docker Compose services (production and development)
├── pinata_front/   Next.js frontend (see pinata_front/README.md)
└── videos/         Pitch/demo scripts, EN and pt-BR subtitles, capture and render scripts (the videos are on YouTube)
```

### Run locally

**With Docker (recommended).** You only need [Docker](https://docs.docker.com/get-docker/) with Compose; Node.js is not required. Run these from the repository root:

```bash
# Production build, the same app that runs on the live site
docker compose up --build        # add -d to run in the background

# Development server with hot reload
docker compose --profile dev watch
```

| Command | What it does |
| --- | --- |
| `docker compose up --build` | Builds the production image (`front` service) and serves it |
| `docker compose --profile dev watch` | Runs `next dev` in a container (`front-dev` service) and syncs every file you save into it |
| `docker compose logs -f` | Follows the logs of the running services |
| `docker compose down` | Stops and removes the containers |

Both services use port 3000, so run one at a time. If your Docker installation only has the standalone Compose binary, write `docker-compose` instead of `docker compose`. In development mode, a change to `package.json` or `package-lock.json` rebuilds the image automatically.

**Without Docker.** Requires Node.js 20.9 or later:

```bash
cd pinata_front
npm install
npm run dev
```

Either way, open http://localhost:3000, create an account, and explore. To try the Piñata burst, create a post with one account, sign out, comment on it with a second account, then sign back in with the first account and open the dashboard.

To connect a wallet, install a Solana wallet such as [Phantom](https://phantom.com/download), sign in, and click **Connect Wallet**. The **Solana wallets** card on the home page opens [`/wallets`](https://pinata-zeta.vercel.app/wallets), which lists the supported wallets, shows which ones your browser has, and links to the [Solana Faucet](https://faucet.solana.com) for free Devnet SOL.

---

## 🇧🇷 Português

> [!IMPORTANT]
> **Status do protótipo: conexão de carteira real, pagamentos simulados.** O MVP atual é um frontend em Next.js. O botão "Connect Wallet" conecta uma carteira Solana de verdade (Phantom, Solflare, Backpack, Trust Wallet ou qualquer outra compatível com o Wallet Standard) pelo Solana Wallet Adapter, na **Devnet**, e mostra o saldo real da carteira na Devnet. **Taxas de comentário, saldos da Piñata e prêmios continuam simulados:** são calculados localmente no navegador, e o app ainda não pede assinaturas nem envia transações. Contas e atividade ficam no `localStorage` do navegador. O programa on-chain é o próximo marco (veja o [Roadmap](#roadmap-1)).

### O que é o Pinata?

As redes sociais estão cheias de spam, bots e respostas sem esforço, porque comentar não custa nada. Os criadores geram o engajamento, mas as plataformas ficam com quase todo o valor.

O Pinata transforma cada comentário público em uma pequena ação econômica:

- **Publicar é grátis.** Qualquer pessoa pode começar uma conversa.
- **Comentar tem uma pequena taxa**, a partir de 0,005 SOL. Quem comenta escolhe o valor. Isso filtra spam e bots e torna cada resposta intencional.
- **A taxa é dividida** entre o criador do post, a plataforma e a Piñata do criador. No protótipo, 40% de cada comentário vai para a **Piñata do Criador**.
- **A Piñata do Criador** é um prêmio gamificado em cada perfil. Quando atinge **60%** da meta, o criador pode **estourá-la**, e o saldo vai para um comentarista elegível daquela rodada. Uma nova rodada começa em seguida.
- **O Piñata Pool da plataforma**, financiado pelas taxas do protocolo, faz um sorteio mensal entre comentaristas ativos.

Criadores ganham com a conversa, comentaristas são recompensados por participar, e a qualidade vence o volume.

### O que funciona hoje

| Área | Status |
| --- | --- |
| Cadastro e login (e-mail ou username) | ✅ Funcionando, salvo no `localStorage` |
| Dashboard pessoal (posts, comentários pagos, valor, Piñata, recompensas) | ✅ Funcionando |
| Posts grátis e comentários pagos com valor escolhido (mín. 0,005 SOL) | ✅ Funcionando, pagamento **simulado** |
| Votos positivos/negativos e ranking de posts em alta | ✅ Funcionando |
| Progresso da Piñata do Criador, limite de 60%, estouro e histórico de vencedores | ✅ Funcionando, prêmio **simulado** |
| Card do Piñata Pool da plataforma com contagem regressiva mensal | ✅ Interface com dados de exemplo |
| Edição de perfil e perfis públicos | ✅ Funcionando |
| Persistência após recarregar (contas, posts, votos, comentários, histórico) | ✅ Funcionando no mesmo navegador |
| Conexão de carteira Solana (Wallet Adapter, Devnet) com saldo real | ✅ Funcionando, somente leitura (sem assinaturas ainda) |
| Página de carteiras compatíveis (`/wallets`) com detecção e guia de faucet da Devnet | ✅ Funcionando |
| Taxas, cofres da Piñata e sorteios on-chain | ⏳ Roadmap |

### Blockchain e ferramentas

- **Blockchain:** Solana Devnet. As carteiras conectam de verdade pelo Solana Wallet Adapter e o app lê o saldo por um RPC da Devnet; os pagamentos em SOL continuam simulados e nada é gravado on-chain ainda.
- **Bibliotecas Solana:** `@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`, `@solana/web3.js` (detecção pelo Wallet Standard, então carteiras só-EVM são ignoradas)
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Validação:** Zod
- **Autenticação local:** Web Crypto API (hash de senha PBKDF2-SHA-256 com salt), sessão no `localStorage`
- **Hospedagem:** Vercel
- **Containers:** Docker e Docker Compose (imagem de produção e servidor de desenvolvimento)
- **Stack Solana planejada:** programa Anchor com PDAs para divisão de taxas e cofres da Piñata, aleatoriedade verificável (ex.: Switchboard VRF) para sorteios justos, tokens SPL (USDC e tokens de comunidade), Solana Actions e Blinks para comentários pagos em qualquer lugar da web

### Composabilidade

O Pinata foi pensado sobre primitivas da Solana, para que cada parte se conecte ao ecossistema:

- **Tokens SPL:** taxas e prêmios em SOL, USDC ou no token de comunidade do criador
- **PDAs:** um cofre de Piñata por criador, auditável por qualquer pessoa
- **Aleatoriedade verificável:** sorteios da Piñata comprovadamente justos
- **Blinks / Solana Actions:** comentar pagando direto no X, no Discord ou em qualquer site que renderize Blinks
- **Wallet Adapter:** qualquer carteira Solana, sem onboarding próprio

### Go-to-market e modelo de negócio

- **Receita:** uma pequena parte do protocolo em cada comentário pago. O Pinata só ganha quando as conversas geram valor.
- **Mercado inicial:** comunidades cripto do Brasil, com a Superteam Brasil, trazendo criadores que já têm audiências engajadas (builders, educadores, líderes de comunidade).
- **Distribuição:** criadores trazem suas audiências; os Blinks levam os comentários pagos para onde o público já está; os sorteios da Piñata dão motivo para voltar e convidar outras pessoas.
- **Expansão:** criadores de toda a América Latina e, depois, qualquer comunidade que queira discussões sem spam e com recompensas.
- **Validação de demanda (próximos passos):** piloto com um pequeno grupo de criadores Solana brasileiros na Devnet, medindo qualidade dos comentários, comentaristas recorrentes e ganhos dos criadores.

### Roadmap

1. ✅ MVP de frontend: feed, posts em alta, perfis, comentários pagos, Piñata do Criador, interface do Pool da plataforma
2. ✅ Contas: cadastro, login, dashboard, persistência local
3. ✅ Conexão real de carteira com Solana Wallet Adapter na Devnet (endereço e saldo)
4. ⏳ Programa Anchor na Devnet: pagamento de comentários, divisão de taxas, cofres da Piñata em PDAs
5. ⏳ Aleatoriedade verificável nos sorteios da Piñata e do Pool
6. ⏳ Contas em backend vinculadas à carteira, Blinks para comentários pagos, suporte a USDC
7. ⏳ Piloto com criadores no Brasil e, depois, mainnet

### Time

- **Samir Dourado** ([@samirdourado](https://github.com/samirdourado)): fundador, produto e desenvolvimento full-stack

Localização: **Brasil** 🇧🇷

### Vídeos

O pitch e a demo estão no YouTube, com narração e legendas em inglês. Os arquivos de vídeo não ficam neste repositório. A pasta `videos/` guarda os roteiros bilíngues, as legendas em inglês e em português do Brasil e as ferramentas que gravam e renderizam os vídeos (veja [videos/README.md](videos/README.md)). Os vídeos foram gravados antes da conexão real de carteira, por isso mostram a carteira simulada anterior.

| Vídeo | Assistir | Roteiro (EN e pt-BR) | Legendas |
| --- | --- | --- | --- |
| Pitch (~2:45) | [YouTube](https://www.youtube.com/watch?v=ev8Xz9rm4Nk) | [pitch-video-script.md](videos/pitch-video-script.md) | [EN](videos/pitch-video-en.srt) · [pt-BR](videos/pitch-video-pt-BR.srt) |
| Demo (~2:45) | [YouTube](https://www.youtube.com/watch?v=Un_GRtISO6M) | [demo-video-script.md](videos/demo-video-script.md) | [EN](videos/demo-video-en.srt) · [pt-BR](videos/demo-video-pt-BR.srt) |

### Rodar localmente

**Com Docker (recomendado).** Você só precisa do [Docker](https://docs.docker.com/get-docker/) com Compose; não é preciso ter Node.js. Rode na raiz do repositório:

```bash
# Build de produção, o mesmo app que roda no site publicado
docker compose up --build        # adicione -d para rodar em segundo plano

# Servidor de desenvolvimento com hot reload
docker compose --profile dev watch
```

| Comando | O que faz |
| --- | --- |
| `docker compose up --build` | Gera a imagem de produção (serviço `front`) e serve o app |
| `docker compose --profile dev watch` | Roda o `next dev` num container (serviço `front-dev`) e sincroniza cada arquivo que você salva |
| `docker compose logs -f` | Acompanha os logs dos serviços em execução |
| `docker compose down` | Para e remove os containers |

Os dois serviços usam a porta 3000, então rode um de cada vez. Se a sua instalação do Docker tiver só o Compose avulso, use `docker-compose` no lugar de `docker compose`. No modo de desenvolvimento, uma mudança no `package.json` ou no `package-lock.json` gera a imagem de novo automaticamente.

**Sem Docker.** Requer Node.js 20.9 ou superior:

```bash
cd pinata_front
npm install
npm run dev
```

Em qualquer um dos casos, abra http://localhost:3000, crie uma conta e explore. Para testar o estouro da Piñata, crie um post com uma conta, saia, comente nele com uma segunda conta e depois entre de novo com a primeira conta e abra o dashboard.

Para conectar uma carteira, instale uma carteira Solana como a [Phantom](https://phantom.com/download), entre na sua conta e clique em **Connect Wallet**. O card **Solana wallets** na home abre a página [`/wallets`](https://pinata-zeta.vercel.app/wallets), que lista as carteiras compatíveis, mostra quais o seu navegador tem e leva ao [Solana Faucet](https://faucet.solana.com) para pegar SOL de Devnet de graça.

## License

[MIT](LICENSE)
