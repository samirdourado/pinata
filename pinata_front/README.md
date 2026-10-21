# Pinata Frontend

Frontend prototype for [Pinata](../README.md), a SocialFi protocol designed for Solana where posting is free, every comment carries a small fee, and part of each fee fills a Piñata prize pool for the community.

Live: https://pinata-zeta.vercel.app/ · [Português](#-português)

> [!IMPORTANT]
> **Solana is simulated in this build.** "Connect Wallet" toggles a sample address (`7Xw3...42a1`) and balance (2.45 SOL). Comment fees, Piñata balances, and prizes are calculated in the browser. No wallet is connected, nothing is signed, and no transaction is sent to Solana.

## 🇺🇸 English

### Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Tailwind CSS v4
- Zod for form and data validation
- Web Crypto API for local password hashing
- Client-side state persisted in `localStorage`

### Features

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
| `/` | Home feed, Piñata Pool, how it works, recent winners |
| `/trending` | All posts with sorting |
| `/register` | Create an account |
| `/login` | Sign in with email or username |
| `/dashboard` | Signed-in account overview and Piñata burst (redirects to `/login` when signed out) |
| `/me` | Redirects to the signed-in user's profile |
| `/profile/[handle]` | Public profile; on your own profile you can publish posts and edit your details |

### How accounts and data are stored

| `localStorage` key | Content |
| --- | --- |
| `pinata-auth-users-v1` | Registered accounts. Passwords are stored as salted PBKDF2-SHA-256 hashes (120,000 iterations), never in plain text. |
| `pinata-auth-session-v1` | ID of the signed-in account |
| `pinata-social-state-v2` | Posts, comments, votes, profiles, and Piñata winners |

Validation rules: username 3 to 20 characters (letters, numbers, underscore), password 6 to 12 characters, bio up to 160 characters. Usernames of the demo profiles are reserved.

> [!WARNING]
> This is prototype authentication, not server-side security. Anything in `localStorage` can be read or edited by the user, and data does not sync between browsers or devices. Do not use it to protect real data or authorize real payments. To reset the demo, clear the site data in your browser.

### Project structure

```text
app/          Routes (App Router)
components/   UI: AuthForm, AuthProvider, Navbar, PostCard, PostDetailModal, ProfileView, PinataPoolCard...
data/         Mock profiles, posts, comments, and winners
interface/    TypeScript models
utils/        authStore (accounts and sessions), socialStore (posts, votes, comments, Piñata),
              pinata (fee share and threshold math), sorting and time helpers
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

- Solana Wallet Adapter for real wallet connection and signatures
- Anchor program on Devnet for comment payments, fee split, and Piñata vaults (PDAs)
- Verifiable randomness for draws
- Accounts linked to wallets on a backend instead of `localStorage`

---

## 🇧🇷 Português

> [!IMPORTANT]
> **A Solana é simulada nesta versão.** O botão "Connect Wallet" alterna um endereço (`7Xw3...42a1`) e saldo (2,45 SOL) de exemplo. Taxas de comentário, saldos da Piñata e prêmios são calculados no navegador. Nenhuma carteira é conectada, nada é assinado e nenhuma transação é enviada para a Solana.

### Stack

- Next.js 16 (App Router) e React 19
- TypeScript
- Tailwind CSS v4
- Zod para validação de formulários e dados
- Web Crypto API para hash de senha local
- Estado no cliente persistido no `localStorage`

### Funcionalidades

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
| `/` | Feed inicial, Piñata Pool, como funciona, vencedores recentes |
| `/trending` | Todos os posts com ordenação |
| `/register` | Criar conta |
| `/login` | Entrar com e-mail ou username |
| `/dashboard` | Visão geral da conta e estouro da Piñata (redireciona para `/login` sem sessão) |
| `/me` | Redireciona para o perfil do usuário logado |
| `/profile/[handle]` | Perfil público; no seu próprio perfil você publica posts e edita seus dados |

### Como contas e dados são armazenados

| Chave no `localStorage` | Conteúdo |
| --- | --- |
| `pinata-auth-users-v1` | Contas cadastradas. Senhas guardadas como hash PBKDF2-SHA-256 com salt (120.000 iterações), nunca em texto puro. |
| `pinata-auth-session-v1` | ID da conta logada |
| `pinata-social-state-v2` | Posts, comentários, votos, perfis e vencedores da Piñata |

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

- Solana Wallet Adapter para conexão e assinaturas reais
- Programa Anchor na Devnet para pagamento de comentários, divisão de taxas e cofres da Piñata (PDAs)
- Aleatoriedade verificável nos sorteios
- Contas vinculadas à carteira em um backend, no lugar do `localStorage`
