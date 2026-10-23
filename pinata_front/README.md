# Pinata Frontend

Frontend prototype for [Pinata](../README.md), a SocialFi protocol designed for Solana where posting is free, every comment carries a small fee, and part of each fee fills a Piñata prize pool for the community.

Live: https://pinata-zeta.vercel.app/ · [Português](#-português)

> [!IMPORTANT]
> **Real wallet, simulated payments.** "Connect Wallet" connects a real Solana wallet through the Solana Wallet Adapter on **Devnet** and shows its real balance. Comment fees, Piñata balances, and prizes are still calculated in the browser: nothing is signed and no transaction is sent to Solana yet.

## 🇺🇸 English

### Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS v4
- Solana Wallet Adapter (`@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`) and `@solana/web3.js`
- Zod for form and data validation
- Web Crypto API for local password hashing
- Client-side state persisted in `localStorage`

### Features

- **Solana wallet:** real connection through the Wallet Adapter (Devnet), live balance, and a supported wallets page
- **Accounts:** registration (display name, username, email, optional bio, password) and sign-in with email or username
- **Dashboard:** posts published, paid comments, total comment value, recent activity, Piñata progress, burst action, and reward history
- **Feed:** home with Piñata Pool card and top trending posts, plus a Trending page sorted by vote balance
- **Posts and comments:** free posts from your profile; paid comments with a chosen value, minimum 0.005 SOL (simulated)
- **Votes:** upvotes and downvotes shared across every view
- **Creator Piñata:** 40% of each valid comment fills the post author's Piñata; at 60% of the target (1 SOL by default) the owner can burst it, and one eligible commenter from the current round receives the balance (simulated)
- **Profiles:** public profiles for every user, profile editing for your own account
- **Persistence:** accounts, session, posts, votes, comments, and Piñata history survive a page refresh in the same browser
- Responsive layout

### Routes

| Route | Description |
| --- | --- |
| `/` | Home feed, Piñata Pool, how it works, recent winners, Solana wallet status card |
| `/trending` | All posts with sorting |
| `/register` | Create an account |
| `/login` | Sign in with email or username |
| `/dashboard` | Signed-in account overview and Piñata burst (redirects to `/login` when signed out) |
| `/me` | Redirects to the signed-in user's profile |
| `/profile/[handle]` | Public profile; on your own profile you can publish posts and edit your details |
| `/wallets` | Supported Solana wallets, browser detection, connection status, and Devnet faucet guide |

### Solana wallet connection

"Connect Wallet" (in the navbar, after signing in) opens a wallet picker built on the [Solana Wallet Adapter](https://github.com/anza-xyz/wallet-adapter):

- Wallets are detected through the **Wallet Standard**, so only wallets that register a Solana account appear. EVM-only wallets such as Ronin, or MetaMask without a Solana account, are ignored.
- Supported and recommended: **Phantom, Solflare, Backpack, and Trust Wallet**. Any other Wallet Standard Solana wallet also works. Wallets that are not installed are shown with an install link.
- Once connected, the navbar shows the wallet icon, the shortened address, and the **real balance** read from the RPC, updated live. The menu lets you copy the address, open it in Solana Explorer, change wallet, or disconnect.
- The chosen wallet is remembered (`pinata-wallet-name-v1` in `localStorage`) and reconnects silently on the next visit.
- The **Solana wallets** card on the home page, visible even when signed out, shows whether this browser has a compatible wallet and opens `/wallets`. That page lists the supported wallets, which ones this browser has, the connected account, why a wallet might be missing, and a link to the [Solana Faucet](https://faucet.solana.com) for Devnet SOL.

The app always uses Solana Devnet through the public Devnet RPC (`utils/solana.ts`).

The connection is read-only for now: Pinata reads the public address and balance, but does not request signatures or send transactions. Comment payments and Piñata prizes are still simulated.

### How accounts and data are stored

| `localStorage` key | Content |
| --- | --- |
| `pinata-auth-users-v1` | Registered accounts. Passwords are stored as salted PBKDF2-SHA-256 hashes (120,000 iterations), never in plain text. |
| `pinata-auth-session-v1` | ID of the signed-in account |
| `pinata-social-state-v2` | Posts, comments, votes, profiles, and Piñata winners |
| `pinata-wallet-name-v1` | Name of the last connected wallet, used to reconnect |

Validation rules: username 3 to 20 characters (letters, numbers, underscore), password 6 to 12 characters, bio up to 160 characters. Usernames of the demo profiles are reserved.

> [!WARNING]
> This is prototype authentication, not server-side security. Anything in `localStorage` can be read or edited by the user, and data does not sync between browsers or devices. Do not use it to protect real data or authorize real payments. To reset the demo, clear the site data in your browser.

### Project structure

```text
app/          Routes (App Router)
components/   UI: AuthForm, AuthProvider, Navbar, PostCard, PostDetailModal, ProfileView, PinataPoolCard...
              Wallet: SolanaProvider (connection, wallet, balance hooks), WalletButton, WalletModal,
              WalletDirectory, WalletStatusCard
data/         Mock profiles, posts, comments, and winners; solanaWallets (supported wallet catalog)
interface/    TypeScript models
utils/        authStore (accounts and sessions), socialStore (posts, votes, comments, Piñata),
              pinata (fee share and threshold math), solana (cluster, RPC, address helpers),
              sorting and time helpers
```

### Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

### Try the full flow

1. Create account A and publish a post from your profile.
2. Sign out, create account B, open A's post, and comment with 1.5 SOL (simulated). 40% (0.6 SOL) goes to A's Piñata.
3. Sign out, sign in as A, and open `/dashboard`. The Piñata is at 60%, so **Burst Piñata** is enabled. Click it and B wins.

### Next steps for Solana

- Transaction signing for paid comments through the connected wallet
- Anchor program on Devnet for comment payments, fee split, and Piñata vaults (PDAs)
- Verifiable randomness for draws
- Accounts linked to wallets on a backend instead of `localStorage`

---

## 🇧🇷 Português

> [!IMPORTANT]
> **Carteira real, pagamentos simulados.** O botão "Connect Wallet" conecta uma carteira Solana de verdade pelo Solana Wallet Adapter na **Devnet** e mostra o saldo real. Taxas de comentário, saldos da Piñata e prêmios continuam sendo calculados no navegador: nada é assinado e nenhuma transação é enviada para a Solana ainda.

### Stack

- Next.js 16 (App Router) e React 19
- TypeScript
- Tailwind CSS v4
- Solana Wallet Adapter (`@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`) e `@solana/web3.js`
- Zod para validação de formulários e dados
- Web Crypto API para hash de senha local
- Estado no cliente persistido no `localStorage`

### Funcionalidades

- **Carteira Solana:** conexão real pelo Wallet Adapter (Devnet), saldo em tempo real e página de carteiras compatíveis
- **Contas:** cadastro (nome de exibição, username, e-mail, bio opcional, senha) e login com e-mail ou username
- **Dashboard:** posts publicados, comentários pagos, valor total dos comentários, atividade recente, progresso da Piñata, ação de estourar e histórico de recompensas
- **Feed:** home com o card do Piñata Pool e os posts em alta, além da página Trending ordenada pelo saldo de votos
- **Posts e comentários:** posts grátis pelo perfil; comentários pagos com valor escolhido, mínimo de 0,005 SOL (simulado)
- **Votos:** positivos e negativos, sincronizados em todas as telas
- **Piñata do Criador:** 40% de cada comentário válido vai para a Piñata do autor do post; ao atingir 60% da meta (1 SOL por padrão) o dono pode estourá-la, e um comentarista elegível da rodada atual recebe o saldo (simulado)
- **Perfis:** perfil público de cada usuário e edição do seu próprio perfil
- **Persistência:** contas, sessão, posts, votos, comentários e histórico da Piñata continuam após recarregar a página no mesmo navegador
- Layout responsivo

### Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Feed inicial, Piñata Pool, como funciona, vencedores recentes, card de status da carteira Solana |
| `/trending` | Todos os posts com ordenação |
| `/register` | Criar conta |
| `/login` | Entrar com e-mail ou username |
| `/dashboard` | Visão geral da conta e estouro da Piñata (redireciona para `/login` sem sessão) |
| `/me` | Redireciona para o perfil do usuário logado |
| `/profile/[handle]` | Perfil público; no seu próprio perfil você publica posts e edita seus dados |
| `/wallets` | Carteiras Solana compatíveis, detecção no navegador, status da conexão e guia de faucet da Devnet |

### Conexão de carteira Solana

O botão "Connect Wallet" (na navbar, depois de entrar na conta) abre um seletor de carteiras feito com o [Solana Wallet Adapter](https://github.com/anza-xyz/wallet-adapter):

- As carteiras são detectadas pelo **Wallet Standard**, então só aparecem carteiras que registram uma conta Solana. Carteiras só-EVM como a Ronin, ou a MetaMask sem conta Solana, são ignoradas.
- Compatíveis e recomendadas: **Phantom, Solflare, Backpack e Trust Wallet**. Qualquer outra carteira Solana com Wallet Standard também funciona. Carteiras não instaladas aparecem com link de instalação.
- Depois de conectar, a navbar mostra o ícone da carteira, o endereço abreviado e o **saldo real** lido do RPC, atualizado em tempo real. O menu permite copiar o endereço, abrir no Solana Explorer, trocar de carteira ou desconectar.
- A carteira escolhida é lembrada (`pinata-wallet-name-v1` no `localStorage`) e reconecta sozinha na próxima visita.
- O card **Solana wallets** na home, visível mesmo sem login, mostra se o navegador tem uma carteira compatível e abre a `/wallets`. Essa página lista as carteiras compatíveis, quais o navegador tem, a conta conectada, por que uma carteira pode não aparecer e um link para o [Solana Faucet](https://faucet.solana.com) para pegar SOL de Devnet.

O app sempre usa a Solana Devnet pelo RPC público da Devnet (`utils/solana.ts`).

Por enquanto a conexão é somente leitura: o Pinata lê o endereço público e o saldo, mas não pede assinaturas nem envia transações. Os pagamentos de comentários e os prêmios da Piñata continuam simulados.

### Como contas e dados são armazenados

| Chave no `localStorage` | Conteúdo |
| --- | --- |
| `pinata-auth-users-v1` | Contas cadastradas. Senhas guardadas como hash PBKDF2-SHA-256 com salt (120.000 iterações), nunca em texto puro. |
| `pinata-auth-session-v1` | ID da conta logada |
| `pinata-social-state-v2` | Posts, comentários, votos, perfis e vencedores da Piñata |
| `pinata-wallet-name-v1` | Nome da última carteira conectada, usado para reconectar |

Regras de validação: username de 3 a 20 caracteres (letras, números e underscore), senha de 6 a 12 caracteres, bio de até 160 caracteres. Os usernames dos perfis de demonstração são reservados.

> [!WARNING]
> É uma autenticação de protótipo, não segurança no servidor. Tudo no `localStorage` pode ser lido ou editado pelo usuário, e os dados não sincronizam entre navegadores ou dispositivos. Não use para proteger dados reais nem autorizar pagamentos reais. Para reiniciar a demo, limpe os dados do site no navegador.

### Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

### Teste o fluxo completo

1. Crie a conta A e publique um post pelo seu perfil.
2. Saia, crie a conta B, abra o post de A e comente com 1,5 SOL (simulado). 40% (0,6 SOL) vai para a Piñata de A.
3. Saia, entre como A e abra `/dashboard`. A Piñata está em 60%, então **Burst Piñata** fica habilitado. Clique e B ganha.

### Próximos passos na Solana

- Assinatura de transações nos comentários pagos pela carteira conectada
- Programa Anchor na Devnet para pagamento de comentários, divisão de taxas e cofres da Piñata (PDAs)
- Aleatoriedade verificável nos sorteios
- Contas vinculadas à carteira em um backend, no lugar do `localStorage`
