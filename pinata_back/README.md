# Pinata Backend

On-chain program for [Pinata](../README.md), written in Rust with [Anchor](https://www.anchor-lang.com/). It holds the money side of the app: paid comment splits, the Piñata prize pools and their verifiable random draws. The design, business rules and decisions are in [docs/DESIGN.md](docs/DESIGN.md) (Portuguese).

[Português](#-português)

> [!NOTE]
> **Status: phase 1 of 5.** The program is written and tested locally. It is not deployed to Devnet yet, and the frontend still uses simulated payments. Next phases: Devnet deploy, API (Rust + PostgreSQL), frontend integration, and draw automation.

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

### Layout

```text
Anchor.toml                  Anchor workspace (program id, test script, build hook)
keys/                        Program keypair (git-ignored, never commit it)
docs/DESIGN.md               Architecture, business rules and decisions
programs/pinata/src/
  lib.rs                     Instruction list
  instructions/              One file per instruction (+ vrf.rs, the shared VRF accounts)
  state/                     Accounts: Config, CreatorProfile, Pinata
  draw.rs, calendar.rs       Winner selection and "1st of the month" (unit tested)
  events.rs, error.rs, constants.rs
programs/pinata/tests/       LiteSVM tests; fixtures/ has the MagicBlock VRF program dumped from Devnet
```

### Build and test (Docker)

You only need Docker. The toolchain (Rust, Solana CLI 3.1, Anchor CLI 1.0.2) runs in the official `solanafoundation/anchor:v1.0.2` image through the `anchor` service in the root `compose.yaml`. Run these from the repository root:

```bash
docker compose run --rm anchor anchor build          # compile to target/deploy/pinata.so
docker compose run --rm anchor anchor run test       # build + unit tests + LiteSVM tests
docker compose run --rm anchor bash                  # shell with every tool
```

The first build downloads the image (about 10 GB) and compiles every dependency, so it takes a few minutes. `target/` and the Cargo caches live in Docker volumes, which keeps later builds fast.

The program keypair in `keys/` defines the program address (`CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8`). A `pre_build` hook copies it into `target/deploy/`. Back it up: without it, the program cannot be deployed at the same address.

---

## 🇧🇷 Português

Programa on-chain do [Pinata](../README.md), escrito em Rust com [Anchor](https://www.anchor-lang.com/). Ele cuida da parte de dinheiro do app: a divisão dos comentários pagos, os prêmios das Piñatas e os sorteios verificáveis. O desenho, as regras de negócio e as decisões estão em [docs/DESIGN.md](docs/DESIGN.md).

> [!NOTE]
> **Status: fase 1 de 5.** O programa está escrito e testado localmente. Ainda não foi publicado na Devnet, e o frontend continua com pagamentos simulados. Próximas fases: deploy na Devnet, API (Rust + PostgreSQL), integração com o frontend e automação dos sorteios.

### O que o programa faz

- **Comentários pagos** (`pay_comment`): cada pagamento é dividido em 35% para o autor do post, 35% para a Piñata do autor, 20% para a Piñata da plataforma e 10% para a plataforma. Cada comentário vira um bilhete nas duas Piñatas; o criador nunca ganha bilhete na própria Piñata.
- **Piñata do criador** (`open_creator_pinata`): o criador escolhe a meta e o mínimo para estourar dentro das faixas da Config. Uma Piñata ativa por criador, e criador sem Piñata não recebe comentários.
- **Estouros** (`request_creator_draw`, `request_platform_draw`):
  - A Piñata do criador estoura em 100% da meta (qualquer um pode disparar) ou a partir do mínimo do criador (só o dono).
  - A Piñata da plataforma estoura em 100% ou no dia 1º do mês (horário de Brasília) a partir do mínimo da Config.
- **Sorteio verificável** (`consume_randomness`): o oráculo [VRF da MagicBlock](https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/introduction/solana-vrf) entrega aleatoriedade com prova. São 1 vencedor na Piñata do criador e até 3 vencedores distintos na da plataforma.
- **Pagamento** (`settle`): paga os vencedores e fecha a Piñata. Sem bilhetes válidos, metade vai para a plataforma e metade para a Piñata da plataforma.
- **Config** (`initialize`, `update_config`): a divisão, o comentário mínimo, as faixas de meta, as regras da plataforma e o fuso horário ficam on-chain e o admin pode alterá-los.

### Estrutura

```text
Anchor.toml                  Workspace do Anchor (id do programa, script de teste, hook de build)
keys/                        Chave do programa (fora do Git, nunca faça commit)
docs/DESIGN.md               Arquitetura, regras de negócio e decisões
programs/pinata/src/
  lib.rs                     Lista de instruções
  instructions/              Um arquivo por instrução (+ vrf.rs, as contas da VRF)
  state/                     Contas: Config, CreatorProfile, Pinata
  draw.rs, calendar.rs       Sorteio dos vencedores e "dia 1º do mês" (com testes unitários)
  events.rs, error.rs, constants.rs
programs/pinata/tests/       Testes com LiteSVM; fixtures/ tem o programa VRF da MagicBlock copiado da Devnet
```

### Compilar e testar (Docker)

Você só precisa do Docker. As ferramentas (Rust, Solana CLI 3.1, Anchor CLI 1.0.2) rodam na imagem oficial `solanafoundation/anchor:v1.0.2`, pelo serviço `anchor` do `compose.yaml` da raiz. Rode na raiz do repositório:

```bash
docker compose run --rm anchor anchor build          # compila para target/deploy/pinata.so
docker compose run --rm anchor anchor run test       # build + testes unitários + testes com LiteSVM
docker compose run --rm anchor bash                  # terminal com todas as ferramentas
```

O primeiro build baixa a imagem (cerca de 10 GB) e compila todas as dependências, então leva alguns minutos. A `target/` e os caches do Cargo ficam em volumes do Docker, o que deixa os builds seguintes rápidos.

A chave do programa em `keys/` define o endereço do programa (`CThrD6V4TBegostJqwo9PvGVRZnEUkDba5mNDxv5toN8`). Um hook `pre_build` copia a chave para `target/deploy/`. Guarde um backup: sem ela, não dá para publicar o programa no mesmo endereço.
