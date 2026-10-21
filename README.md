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
  <a href="videos/">Pitch and demo videos</a> ·
  <a href="#-português">Português</a>
</p>

> [!IMPORTANT]
> **Prototype status: the Solana integration is simulated.** The current MVP is a Next.js frontend. "Connect Wallet" shows a sample address and balance, and every SOL amount (comment fees, Piñata balances, prizes) is calculated locally in the browser. **No wallet is connected and no transaction is sent to Solana yet.** Accounts and activity are stored in the browser's `localStorage`. The on-chain program is the next milestone (see [Roadmap](#roadmap)).

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
| Solana wallet connection | 🟡 **Simulated** (sample address and balance) |
| On-chain fees, Piñata vaults, and draws | ⏳ Roadmap |

### Blockchain and tools

- **Blockchain:** Solana (target network: Devnet first). The current build simulates the wallet and SOL payments; nothing is on-chain yet.
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Validation:** Zod
- **Local auth:** Web Crypto API (salted PBKDF2-SHA-256 password hashes), `localStorage` sessions
- **Hosting:** Vercel
- **Planned Solana stack:** Solana Wallet Adapter (Phantom, Solflare, Backpack), Anchor program with PDAs for fee splits and Piñata vaults, verifiable randomness (e.g. Switchboard VRF) for fair draws, SPL tokens (USDC and community tokens), Solana Actions and Blinks for paid comments anywhere on the web

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
3. ⏳ Real wallet connection with Solana Wallet Adapter
4. ⏳ Anchor program on Devnet: comment payments, fee split, Piñata vaults in PDAs
5. ⏳ Verifiable randomness for Piñata and Platform Pool draws
6. ⏳ Backend accounts linked to wallets, Blinks for paid comments, USDC support
7. ⏳ Creator pilot in Brazil, then mainnet

### Team

- **Samir Dourado** ([@samirdourado](https://github.com/samirdourado)): founder, product, and full-stack development

Location: **Brazil** 🇧🇷

### Videos

Each video comes in **English** and **Brazilian Portuguese**, with narration and burned-in subtitles in the same language, plus `.srt` files for YouTube or Loom. See [videos/README.md](videos/README.md).

| Video | English | Português (pt-BR) | Script |
| --- | --- | --- | --- |
| Pitch | `videos/pitch-video-en.mp4` (~2:45) | `videos/pitch-video-pt-BR.mp4` (~2:50) | [pitch-video-script.md](videos/pitch-video-script.md) |
| Demo | `videos/demo-video-en.mp4` (~2:45) | `videos/demo-video-pt-BR.mp4` (~2:40) | [demo-video-script.md](videos/demo-video-script.md) |

<!-- Add the public YouTube/Loom links here after uploading the videos. -->

### Repository structure

```text
pinata/
├── pinata_front/   Next.js frontend (see pinata_front/README.md)
└── videos/         Pitch/demo scripts, EN and pt-BR subtitles, capture and render scripts
```

### Run locally

```bash
cd pinata_front
npm install
npm run dev
```

Open http://localhost:3000, create an account, and explore. To try the Piñata burst, create a post with one account, sign out, comment on it with a second account, then sign back in with the first account and open the dashboard.

---

## 🇧🇷 Português

> [!IMPORTANT]
> **Status do protótipo: a integração com a Solana é simulada.** O MVP atual é um frontend em Next.js. O botão "Connect Wallet" mostra um endereço e saldo de exemplo, e todos os valores em SOL (taxas de comentário, saldos da Piñata, prêmios) são calculados localmente no navegador. **Nenhuma carteira é conectada e nenhuma transação é enviada para a Solana ainda.** Contas e atividade ficam no `localStorage` do navegador. O programa on-chain é o próximo marco (veja o [Roadmap](#roadmap-1)).

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
| Conexão de carteira Solana | 🟡 **Simulada** (endereço e saldo de exemplo) |
| Taxas, cofres da Piñata e sorteios on-chain | ⏳ Roadmap |

### Blockchain e ferramentas

- **Blockchain:** Solana (rede alvo: Devnet primeiro). A versão atual simula a carteira e os pagamentos em SOL; nada está on-chain ainda.
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Validação:** Zod
- **Autenticação local:** Web Crypto API (hash de senha PBKDF2-SHA-256 com salt), sessão no `localStorage`
- **Hospedagem:** Vercel
- **Stack Solana planejada:** Solana Wallet Adapter (Phantom, Solflare, Backpack), programa Anchor com PDAs para divisão de taxas e cofres da Piñata, aleatoriedade verificável (ex.: Switchboard VRF) para sorteios justos, tokens SPL (USDC e tokens de comunidade), Solana Actions e Blinks para comentários pagos em qualquer lugar da web

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
3. ⏳ Conexão real de carteira com Solana Wallet Adapter
4. ⏳ Programa Anchor na Devnet: pagamento de comentários, divisão de taxas, cofres da Piñata em PDAs
5. ⏳ Aleatoriedade verificável nos sorteios da Piñata e do Pool
6. ⏳ Contas em backend vinculadas à carteira, Blinks para comentários pagos, suporte a USDC
7. ⏳ Piloto com criadores no Brasil e, depois, mainnet

### Time

- **Samir Dourado** ([@samirdourado](https://github.com/samirdourado)): fundador, produto e desenvolvimento full-stack

Localização: **Brasil** 🇧🇷

### Vídeos

Cada vídeo existe em **inglês** e em **português do Brasil**, com narração e legendas embutidas no mesmo idioma, além dos arquivos `.srt` para YouTube ou Loom. Veja [videos/README.md](videos/README.md).

| Vídeo | Inglês | Português (pt-BR) | Roteiro |
| --- | --- | --- | --- |
| Pitch | `videos/pitch-video-en.mp4` (~2:45) | `videos/pitch-video-pt-BR.mp4` (~2:50) | [pitch-video-script.md](videos/pitch-video-script.md) |
| Demo | `videos/demo-video-en.mp4` (~2:45) | `videos/demo-video-pt-BR.mp4` (~2:40) | [demo-video-script.md](videos/demo-video-script.md) |

### Rodar localmente

```bash
cd pinata_front
npm install
npm run dev
```

Abra http://localhost:3000, crie uma conta e explore. Para testar o estouro da Piñata, crie um post com uma conta, saia, comente nele com uma segunda conta e depois entre de novo com a primeira conta e abra o dashboard.

## License

[MIT](LICENSE)
