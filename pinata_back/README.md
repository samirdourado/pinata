# Pinata Backend

Backend for [Pinata](../README.md), in Rust:

- **On-chain program** (Rust, [Anchor](https://www.anchor-lang.com/)): the money side. It handles paid comment splits, the Piñata prize pools and their verifiable random draws.
- **API** (Rust, [Axum](https://github.com/tokio-rs/axum), PostgreSQL): the content side. It handles wallet sign-in, profiles, posts, comments, votes and Piñata pages, and checks every paid comment against its Solana transaction.
- **CLI** (Rust): Devnet tooling to initialize the program, run test rounds and drive the API end to end.

The design, business rules and decisions are in [docs/DESIGN.md](docs/DESIGN.md) (Portuguese).

[Português](#-português)

> [!NOTE]
> **Status: phase 3 of 5.**
> - The program is deployed to Devnet and was tested there with the real MagicBlock oracle.
> - The API runs with PostgreSQL and the demo data.
> - The frontend still uses simulated payments and `localStorage`.
>
> Next phases: frontend integration, then draw automation.

## 🇺🇸 English

### What the program does

- **Paid comments** (`pay_comment`): each payment is split 35% to the post author, 35% to the author's Piñata, 20% to the platform Piñata and 10% to the platform. Each comment is a ticket in both Piñatas; creators never get tickets in their own Piñata.
- **Creator Piñata** (`open_creator_pinata`): the creator picks a target and an early-burst minimum within the Config ranges. One active Piñata per creator, and a creator without one cannot receive comments.
- **Bursts** (`request_creator_draw`, `request_platform_draw`):
  - A creator Piñata bursts at 100% of its target (anyone can trigger it) or from the creator's minimum (only the owner).
  - The platform Piñata bursts at 100%, or on the 1st of the month (Brasília time) from the Config minimum.
- **Verifiable draw** (`consume_randomness`): the [MagicBlock VRF](https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/introduction/solana-vrf) oracle delivers proven randomness. There is 1 winner for a creator Piñata and up to 3 distinct winners for the platform Piñata.
- **Payout** (`settle`): pays the winners and closes the Piñata. With no eligible tickets, half goes to the platform and half to the platform Piñata.
- **Config** (`initialize`, `update_config`): the split, minimum comment, target ranges, platform rules and timezone live on-chain and can be changed by the admin.

### What the API does

- **Sign in with the wallet.**
  - There are no passwords. The wallet signs a message ([Sign In With Solana](https://github.com/phantom/sign-in-with-solana) format). The signature is free and moves no SOL.
  - The API checks the signature and opens a session in an HttpOnly cookie.
  - The first sign-in creates the account. The user then picks a username and name, and needs them to post.
- **Anyone comments by paying**, with or without an account:
  1. The API saves the comment as `pending` and returns the accounts the wallet needs to pay.
  2. After payment, the API reads the transaction from Solana and publishes the comment only if it paid for that exact comment, wallet, creator and amount.
- **The wallet is the commenter's identity.** If someone comments anonymously and later signs in with the same wallet, all their past comments show their profile.
- **Piñatas** are read live from the chain. Past winners come from the database, because settled Piñata accounts are closed on-chain.

| Method and path | What it does |
| --- | --- |
| `POST /auth/nonce` · `POST /auth/verify` · `POST /auth/logout` | Wallet sign-in: get the message, send the signature, sign out |
| `GET /me` · `PATCH /me` | Signed-in account; set username, name and bio |
| `GET /users/{username}` · `GET /users/{username}/pinata` | Public profile; open Piñata and latest winners |
| `GET /posts?author=&before=&limit=` · `POST /posts` | Feed (newest first, paginated); new post |
| `GET /posts/{id}` · `POST /posts/{id}/vote` | Post with its comments; like (1), dislike (-1) or remove (0) |
| `POST /posts/{id}/comments` · `POST /comments/{id}/confirm` | Start a paid comment; confirm it with the transaction signature |
| `GET /pinatas/rules` · `GET /pinatas/platform` · `GET /pinatas/winners` | On-chain rules; platform Piñata; latest winners |

### Layout

```text
Anchor.toml                  Anchor workspace (program id, test script, build hook)
keys/                        Keypairs: program, deploy/admin, test wallets, demo profiles (git-ignored, never commit them)
docs/DESIGN.md               Architecture, business rules and decisions
programs/pinata/src/
  lib.rs                     Instruction list
  instructions/              One file per instruction (+ vrf.rs, the shared VRF accounts)
  state/                     Accounts: Config, CreatorProfile, Pinata
  pda.rs                     Account addresses, shared by the CLI, the API and the tests
  draw.rs, calendar.rs       Winner selection and "1st of the month" (unit tested)
  events.rs, error.rs, constants.rs
programs/pinata/tests/       LiteSVM tests; fixtures/ has the MagicBlock VRF program dumped from Devnet
api/
  migrations/                Database schema (applied when the API starts)
  src/                       auth, users, posts, comments, pinatas, chain (Solana reads), seed (demo data)
  Dockerfile, .env.example
cli/                         Devnet client: init, status, draw-demo, demo-pinatas, api-demo
```

### Build and test (Docker)

You only need Docker. The toolchain (Rust, Solana CLI 3.1, Anchor CLI 1.0.2) runs in the official `solanafoundation/anchor:v1.0.2` image through the `anchor` service in the root `compose.yaml`. Run these from the repository root:

```bash
docker compose run --rm anchor anchor build          # compile to target/deploy/pinata.so
docker compose run --rm anchor anchor run test       # build + unit tests + LiteSVM tests
docker compose run --rm anchor bash                  # shell with every tool
```

The first build downloads the image (about 10 GB) and compiles every dependency, so it takes a few minutes. `target/` and the Cargo caches live in Docker volumes, which keeps later builds fast.

The program keypair in `keys/` defines the program address (`CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8`). A `pre_build` hook copies it into `target/deploy/`. Back up the whole `keys/` folder: without the program keypair, the program cannot be deployed at the same address.

### Run the API (Docker)

```bash
docker compose --profile api up --build -d db api                            # PostgreSQL (host port 5433) + API on http://localhost:8080
docker compose run --rm anchor cargo run -q -p pinata-api -- seed       # demo data (--reset to recreate it)
docker compose run --rm anchor cargo run -q -p pinata-cli -- demo-pinatas            # open Devnet Piñatas for the demo profiles
docker compose run --rm anchor cargo run -q -p pinata-cli -- api-demo http://api:8080   # end-to-end test against the API
docker compose --profile api down                                       # stop (the data stays in the pinata-db volume)
```

- **The API applies its migrations when it starts.**
- **`seed`** loads the profiles, posts, comments and winners from the web app's demo data.
  - Each demo profile gets a wallet whose keypair is saved in `keys/demo/`.
  - The profile `samirdourado` uses `DEMO_OWNER_WALLET` from `pinata_back/.env` when it is set, so its owner can sign in as that profile.
  - Demo comments and winners were never paid on-chain, so they have no transaction signature.
- **`demo-pinatas`** opens a real Devnet Piñata for each demo profile (target 1 SOL, early burst from 60%), so their posts can receive real paid comments.
- **`api-demo`** does what the web app will do, with a test wallet instead of Phantom:
  1. sign in by signing the message;
  2. comment on a post, paying on Devnet;
  3. let the API confirm the payment;
  4. like the post.

Settings are environment variables; `api/.env.example` lists them. To use your own PostgreSQL instead of the container, point `DATABASE_URL` at it.

### Devnet

| What | Address |
| --- | --- |
| Program | [`CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8`](https://solscan.io/account/CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8?cluster=devnet) |
| Admin and upgrade authority (`keys/deploy-keypair.json`) | `DFmPPpaVFRdf3ewjy47HD2kMzzX4pEYjQscfqvbagdqb` |
| Platform wallet | `BHC69pYbBMppUc9xc4QLMCbiPm9W7EMstYSr3gPJ3Bin` |
| Config | `9hjHx23ZqsLwezgNBB14XVThbBrbYTLVyqTSUPhuJqZL` |

The Devnet Config uses the agreed rules with small amounts (`devnet_params` in `cli/src/main.rs`): minimum comment 0.005 SOL, creator targets from 0.01 SOL, platform Piñata target 0.1 SOL.

```bash
# upgrade the program after a change (keeps the address)
docker compose run --rm anchor bash -c "anchor build && solana program deploy target/deploy/pinata.so --program-id keys/pinata-program-keypair.json --keypair keys/deploy-keypair.json --url devnet"

docker compose run --rm anchor cargo run -q -p pinata-cli -- status      # Config, platform and creator Piñatas
docker compose run --rm anchor cargo run -q -p pinata-cli -- draw-demo   # full round with the real oracle
```

`draw-demo` runs a full round and resumes from the current state if it is interrupted:
1. opens a creator Piñata, with the admin key as the creator;
2. funds two test commenters (`keys/devnet-commenter-*.json`, 0.02 SOL each) and pays one comment from each;
3. bursts the Piñata early;
4. waits for the MagicBlock oracle;
5. settles.

---

## 🇧🇷 Português

Backend do [Pinata](../README.md), em Rust:

- **Programa on-chain** (Rust, [Anchor](https://www.anchor-lang.com/)): a parte de dinheiro. Cuida da divisão dos comentários pagos, dos prêmios das Piñatas e dos sorteios verificáveis.
- **API** (Rust, [Axum](https://github.com/tokio-rs/axum), PostgreSQL): a parte de conteúdo. Cuida do login com a carteira, dos perfis, posts, comentários, votos e páginas das Piñatas, e confere cada comentário pago contra a transação dele na Solana.
- **CLI** (Rust): ferramentas da Devnet para inicializar o programa, rodar rodadas de teste e testar a API de ponta a ponta.

O desenho, as regras de negócio e as decisões estão em [docs/DESIGN.md](docs/DESIGN.md).

> [!NOTE]
> **Status: fase 3 de 5.**
> - O programa está publicado na Devnet e foi testado lá com o oráculo real da MagicBlock.
> - A API roda com PostgreSQL e os dados de demonstração.
> - O frontend continua com pagamentos simulados e `localStorage`.
>
> Próximas fases: integração com o frontend e automação dos sorteios.

### O que o programa faz

- **Comentários pagos** (`pay_comment`): cada pagamento é dividido em 35% para o autor do post, 35% para a Piñata do autor, 20% para a Piñata da plataforma e 10% para a plataforma. Cada comentário vira um bilhete nas duas Piñatas; o criador nunca ganha bilhete na própria Piñata.
- **Piñata do criador** (`open_creator_pinata`): o criador escolhe a meta e o mínimo para estourar dentro das faixas da Config. Uma Piñata ativa por criador, e criador sem Piñata não recebe comentários.
- **Estouros** (`request_creator_draw`, `request_platform_draw`):
  - A Piñata do criador estoura em 100% da meta (qualquer um pode disparar) ou a partir do mínimo do criador (só o dono).
  - A Piñata da plataforma estoura em 100% ou no dia 1º do mês (horário de Brasília) a partir do mínimo da Config.
- **Sorteio verificável** (`consume_randomness`): o oráculo [VRF da MagicBlock](https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/introduction/solana-vrf) entrega aleatoriedade com prova. São 1 vencedor na Piñata do criador e até 3 vencedores distintos na da plataforma.
- **Pagamento** (`settle`): paga os vencedores e fecha a Piñata. Sem bilhetes válidos, metade vai para a plataforma e metade para a Piñata da plataforma.
- **Config** (`initialize`, `update_config`): a divisão, o comentário mínimo, as faixas de meta, as regras da plataforma e o fuso horário ficam on-chain e o admin pode alterá-los.

### O que a API faz

- **Login com a carteira.**
  - Não há senha. A carteira assina uma mensagem (formato [Sign In With Solana](https://github.com/phantom/sign-in-with-solana)). A assinatura é grátis e não move SOL.
  - A API confere a assinatura e abre uma sessão num cookie HttpOnly.
  - O primeiro login cria a conta. Depois a pessoa escolhe nome de usuário e nome, que são necessários para postar.
- **Qualquer pessoa comenta pagando**, com ou sem conta:
  1. A API guarda o comentário como `pending` e devolve as contas de que a carteira precisa para pagar.
  2. Depois do pagamento, a API lê a transação na Solana e só publica o comentário se ela pagou exatamente aquele comentário, com aquela carteira, aquele criador e aquele valor.
- **A carteira é a identidade de quem comenta.** Se alguém comenta anônimo e depois entra com a mesma carteira, todos os comentários antigos passam a mostrar o perfil.
- **As Piñatas** são lidas ao vivo da blockchain. Os vencedores antigos vêm do banco, porque a conta de uma Piñata paga é fechada on-chain.

| Método e caminho | O que faz |
| --- | --- |
| `POST /auth/nonce` · `POST /auth/verify` · `POST /auth/logout` | Login com a carteira: pegar a mensagem, enviar a assinatura, sair |
| `GET /me` · `PATCH /me` | Conta logada; definir usuário, nome e bio |
| `GET /users/{username}` · `GET /users/{username}/pinata` | Perfil público; Piñata aberta e últimos vencedores |
| `GET /posts?author=&before=&limit=` · `POST /posts` | Feed (mais novos primeiro, paginado); novo post |
| `GET /posts/{id}` · `POST /posts/{id}/vote` | Post com os comentários; curtir (1), não curtir (-1) ou remover (0) |
| `POST /posts/{id}/comments` · `POST /comments/{id}/confirm` | Iniciar um comentário pago; confirmar com a assinatura da transação |
| `GET /pinatas/rules` · `GET /pinatas/platform` · `GET /pinatas/winners` | Regras on-chain; Piñata da plataforma; últimos vencedores |

### Estrutura

```text
Anchor.toml                  Workspace do Anchor (id do programa, script de teste, hook de build)
keys/                        Chaves: programa, deploy/admin, carteiras de teste, perfis de demonstração (fora do Git, nunca faça commit)
docs/DESIGN.md               Arquitetura, regras de negócio e decisões
programs/pinata/src/
  lib.rs                     Lista de instruções
  instructions/              Um arquivo por instrução (+ vrf.rs, as contas da VRF)
  state/                     Contas: Config, CreatorProfile, Pinata
  pda.rs                     Endereços das contas, usados pelo CLI, pela API e pelos testes
  draw.rs, calendar.rs       Sorteio dos vencedores e "dia 1º do mês" (com testes unitários)
  events.rs, error.rs, constants.rs
programs/pinata/tests/       Testes com LiteSVM; fixtures/ tem o programa VRF da MagicBlock copiado da Devnet
api/
  migrations/                Esquema do banco (aplicado quando a API inicia)
  src/                       auth, users, posts, comments, pinatas, chain (leituras da Solana), seed (dados de demonstração)
  Dockerfile, .env.example
cli/                         Cliente da Devnet: init, status, draw-demo, demo-pinatas, api-demo
```

### Compilar e testar (Docker)

Você só precisa do Docker. As ferramentas (Rust, Solana CLI 3.1, Anchor CLI 1.0.2) rodam na imagem oficial `solanafoundation/anchor:v1.0.2`, pelo serviço `anchor` do `compose.yaml` da raiz. Rode na raiz do repositório:

```bash
docker compose run --rm anchor anchor build          # compila para target/deploy/pinata.so
docker compose run --rm anchor anchor run test       # build + testes unitários + testes com LiteSVM
docker compose run --rm anchor bash                  # terminal com todas as ferramentas
```

O primeiro build baixa a imagem (cerca de 10 GB) e compila todas as dependências, então leva alguns minutos. A `target/` e os caches do Cargo ficam em volumes do Docker, o que deixa os builds seguintes rápidos.

A chave do programa em `keys/` define o endereço do programa (`CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8`). Um hook `pre_build` copia a chave para `target/deploy/`. Guarde um backup da pasta `keys/` inteira: sem a chave do programa, não dá para publicá-lo no mesmo endereço.

### Rodar a API (Docker)

```bash
docker compose --profile api up --build -d db api                            # PostgreSQL (porta 5433 no host) + API em http://localhost:8080
docker compose run --rm anchor cargo run -q -p pinata-api -- seed       # dados de demonstração (--reset para recriar)
docker compose run --rm anchor cargo run -q -p pinata-cli -- demo-pinatas            # abre Piñatas na Devnet para os perfis de demonstração
docker compose run --rm anchor cargo run -q -p pinata-cli -- api-demo http://api:8080   # teste de ponta a ponta contra a API
docker compose --profile api down                                       # para tudo (os dados ficam no volume pinata-db)
```

- **A API aplica as migrations quando inicia.**
- **O `seed`** carrega os perfis, posts, comentários e vencedores dos dados de demonstração do app.
  - Cada perfil de demonstração ganha uma carteira, com a chave salva em `keys/demo/`.
  - O perfil `samirdourado` usa o `DEMO_OWNER_WALLET` do `pinata_back/.env` quando ele está definido, para que o dono entre com esse perfil.
  - Os comentários e vencedores de demonstração nunca foram pagos on-chain, então não têm assinatura de transação.
- **O `demo-pinatas`** abre uma Piñata real na Devnet para cada perfil de demonstração (meta de 1 SOL, estouro antecipado a partir de 60%), para que os posts deles recebam comentários pagos de verdade.
- **O `api-demo`** faz o que o app vai fazer, com uma carteira de teste no lugar do Phantom:
  1. login assinando a mensagem;
  2. comentário num post, pago na Devnet;
  3. confirmação do pagamento pela API;
  4. curtida no post.

As configurações são variáveis de ambiente, listadas em `api/.env.example`. Para usar o seu PostgreSQL em vez do container, aponte o `DATABASE_URL` para ele.

### Devnet

| O quê | Endereço |
| --- | --- |
| Programa | [`CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8`](https://solscan.io/account/CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8?cluster=devnet) |
| Admin e upgrade authority (`keys/deploy-keypair.json`) | `DFmPPpaVFRdf3ewjy47HD2kMzzX4pEYjQscfqvbagdqb` |
| Carteira da plataforma | `BHC69pYbBMppUc9xc4QLMCbiPm9W7EMstYSr3gPJ3Bin` |
| Config | `9hjHx23ZqsLwezgNBB14XVThbBrbYTLVyqTSUPhuJqZL` |

A Config da Devnet usa as regras combinadas com valores pequenos (`devnet_params` em `cli/src/main.rs`): comentário mínimo de 0,005 SOL, metas de criador a partir de 0,01 SOL e meta da Piñata da plataforma de 0,1 SOL.

```bash
# atualiza o programa depois de uma mudança (mantém o endereço)
docker compose run --rm anchor bash -c "anchor build && solana program deploy target/deploy/pinata.so --program-id keys/pinata-program-keypair.json --keypair keys/deploy-keypair.json --url devnet"

docker compose run --rm anchor cargo run -q -p pinata-cli -- status      # Config, Piñata da plataforma e do criador
docker compose run --rm anchor cargo run -q -p pinata-cli -- draw-demo   # rodada completa com o oráculo real
```

O `draw-demo` roda uma rodada completa e, se for interrompido, continua de onde parou:
1. abre uma Piñata de criador, usando a chave de admin como criador;
2. manda 0,02 SOL para dois comentaristas de teste (`keys/devnet-commenter-*.json`) e paga um comentário de cada;
3. estoura a Piñata antes da meta;
4. espera o oráculo da MagicBlock;
5. paga o vencedor.
