# Pinata: desenho do backend

Documento vivo. Junta as regras de negócio definidas pelo Samir e as decisões técnicas tomadas para implementá-las. Itens marcados com **[decisão técnica]** foram escolhas de implementação e podem ser revistos.

## 1. Visão geral

O Pinata é uma aplicação **web2** em que **só o dinheiro passa pela Solana**:

```
Navegador (Next.js) ──HTTP──> API (Rust, Axum) ──SQL──> PostgreSQL
      │                          │                       (posts, comentários, votos, perfis)
      │ a carteira assina        │ automação (crank): dispara estouros automáticos
      ▼                          ▼
           Programa "pinata" na Solana (Rust, Anchor)  <──  oráculo VRF (MagicBlock)
           (divisão das taxas, cofres das piñatas, sorteios, prêmios)
```

- **PostgreSQL** guarda o conteúdo: perfis, posts, comentários, votos e o histórico.
- **Programa Anchor** guarda e move o SOL. Ninguém, nem a plataforma, consegue sacar das piñatas por fora das regras.
- **API** liga os dois: confere na blockchain que um comentário foi pago antes de publicá-lo e dispara os estouros automáticos.

## 2. Regras de negócio

### Usuários

- Só quem **posta** precisa de conta (o criador).
- **O login é a própria carteira** (decidido em 02/11/2026):
  - A carteira assina uma mensagem; não há senha nem e-mail obrigatório.
  - Uma carteira é uma conta, e a carteira da conta é a dona da Piñata on-chain.
- **Qualquer pessoa comenta**, inclusive anônima: basta pagar com uma carteira. A carteira é a identidade do comentarista.
- **Vínculo automático:** se alguém comentou anônimo e depois entra com a mesma carteira, todos os comentários antigos passam a mostrar o perfil. Não existe tabela separada de comentários anônimos; o prêmio já chega sozinho, porque o bilhete on-chain é a carteira.
- Todos veem os comentários de todos.

### Divisão de cada comentário pago

| Destino | % |
| --- | --- |
| Criador do post (direto na carteira) | 35% |
| Piñata do criador | 35% |
| Piñata da plataforma (pool) | 20% |
| Plataforma (`PINATA_WALLET`) | 10% |

Os percentuais ficam na conta `Config` on-chain, em pontos-base (10.000 = 100%), e a soma precisa ser exatamente 10.000. Sobras de arredondamento (frações de lamport) ficam com a plataforma, então nenhum lamport se perde.

### Piñata do criador

- O próprio criador cria a sua piñata no dashboard, escolhendo a **meta** e o **mínimo para estourar**, dentro das faixas da `Config`. Fase de testes: mínimo entre **1% e 90%** da meta.
- Uma piñata criada **não pode ser alterada**.
- Só existe **uma piñata ativa por criador**. A próxima só pode ser criada depois que a anterior foi sorteada e paga.
- **Criador sem piñata ativa não recebe comentários.**
- **Estouro automático** ao atingir 100% da meta.
- **Estouro antecipado:** o dono pode estourar quando a piñata atinge o mínimo que ele escolheu.
- Não há data para estourar sozinha.
- **1 vencedor**, sorteado entre os comentários da rodada.
- **O dono não concorre** na própria piñata.

### Piñata da plataforma (pool)

- Meta definida na `Config`.
- **Estouro automático** ao atingir 100% da meta, em qualquer dia.
- **No dia 1º de cada mês**, estoura se estiver pelo menos no mínimo da `Config` (começa em 60%).
- **X vencedores** (começa em 3), sempre **carteiras diferentes**; o prêmio é dividido igualmente. Com menos participantes aptos do que X, o prêmio é dividido entre os que houver (1 participante leva tudo).
- Comentários do criador **no próprio post** contam para a piñata da plataforma.
- Uma nova rodada começa assim que o sorteio é pedido.

### Bilhetes do sorteio

- **Cada comentário pago é um bilhete.** Mais comentários, mais chances.
- Um comentário gera um bilhete na piñata do criador do post (se quem comenta não for o dono) e um na piñata da plataforma.

### Sem participantes

Se uma piñata estourar sem bilhetes válidos (por exemplo, quando só o próprio dono comentou), **metade do saldo vai para a plataforma e metade para a piñata da plataforma**.

## 3. Por que essas escolhas

### Quem dispara os estouros **[decisão técnica]**

As regras ficam **dentro do programa**: ele confere a meta, o mínimo e a data antes de aceitar um sorteio. Por isso, qualquer um pode chamar o estouro automático; o programa recusa se a regra não for cumprida. Na prática, quem chama é a **automação do backend (crank)**, que acompanha os saldos.

- **Estouro antecipado do criador:** exige a **assinatura do dono** pela carteira, no frontend. Assim nem o backend consegue estourar a piñata de alguém sem autorização, e o backend continua sendo avisado.
- **Horário:** o programa usa o **relógio da própria blockchain** (`Clock`), que ninguém consegue falsificar. O "dia 1º" é calculado no fuso de Brasília (UTC-3), configurável na `Config`. A automação chama o estouro logo depois da meia-noite.

### Aleatoriedade **[decisão técnica]**

Usamos a **VRF da MagicBlock** (Verifiable Random Function). Em resumo:

1. O programa pede um número aleatório ao oráculo da MagicBlock.
2. O oráculo devolve o número com uma **prova criptográfica**, verificada on-chain antes de entregar o resultado.
3. Ninguém (nem a plataforma, nem o oráculo, nem quem comentou) consegue escolher ou prever o resultado.

Escolhemos a MagicBlock em vez da Switchboard porque a integração é mais simples (pede e recebe numa "callback") e já funciona na Devnet com a mesma versão do Anchor que usamos.

### Bilhetes on-chain e custo de armazenamento (rent) **[decisão técnica]**

Para o sorteio ser verificável, a lista de bilhetes precisa estar **na blockchain**: cada bilhete são 32 bytes (o endereço da carteira) gravados na própria conta da piñata.

Na Solana, guardar dados exige um depósito (*rent*) de cerca de **0,00022 SOL por bilhete**. O depósito é **descontado da parte da plataforma** (10%) no mesmo pagamento. Por isso o comentarista paga exatamente o valor que escolheu, e a plataforma **recebe o depósito de volta** quando a piñata fecha, depois do sorteio. Custo extra para ninguém.

A `Config` garante que o comentário mínimo cobre os depósitos: 10% de 0,005 SOL = 0,0005 SOL, contra 2 × 0,00022 SOL = 0,00045 SOL.

### Carteiras secundárias do criador

Não existe forma 100% segura de impedir que alguém crie outra carteira. O que fazemos:

1. **Bloqueio direto:** a carteira vinculada à conta do criador nunca gera bilhete na piñata dele (regra on-chain).
2. **Incentivo econômico:** fraudar dá prejuízo. Se o criador comentar com outra carteira na própria piñata, 35% voltam para ele, mas 30% vão para a plataforma e para o pool. Para recuperar a perda, ele ainda precisaria ganhar o sorteio contra os comentaristas reais.
3. **Depois do hackathon (opcional):** prova de humanidade (Civic Pass, World ID) ou limites por conta.

## 4. Programa Anchor

### Contas (PDAs)

| Conta | Sementes | Conteúdo |
| --- | --- | --- |
| `Config` | `["config"]` | admin, carteira da plataforma, divisão, valores mínimos, faixas de meta, regras do pool, fuso horário, rodada atual do pool |
| `CreatorProfile` | `["creator", carteira]` | rodada atual e se há piñata ativa |
| `Pinata` | `["pinata", dono, rodada]` | tipo (criador/plataforma), meta, mínimo, status, vencedores e a lista de bilhetes |

O SOL do prêmio fica na própria conta `Pinata`. Invariante: `saldo = rent(tamanho) + prêmio`.

### Instruções

| Instrução | Quem assina | O que faz |
| --- | --- | --- |
| `initialize` | admin | cria a `Config` e a 1ª rodada do pool |
| `update_config` | admin | altera os parâmetros (vale para as próximas piñatas) |
| `open_creator_pinata` | criador | cria a piñata do criador (meta e mínimo dentro das faixas) |
| `pay_comment` | comentarista | divide o pagamento e registra os bilhetes |
| `request_draw` | qualquer um (dono, no estouro antecipado) | confere as regras, congela o prêmio e pede a VRF; no pool, abre a próxima rodada |
| `consume_randomness` | só o oráculo VRF | escolhe os vencedores |
| `settle` | qualquer um | paga os vencedores e fecha a conta, devolvendo os depósitos |

### Sorteio

`consume_randomness` usa os 32 bytes aleatórios como semente de um gerador determinístico (SplitMix64, em `src/draw.rs`). Qualquer pessoa pode refazer o sorteio a partir da aleatoriedade e dos bilhetes publicados on-chain. Cada bilhete tem a mesma chance; uma carteira repetida é ignorada até achar outra, e se as tentativas aleatórias se esgotarem, uma varredura garante encontrar as carteiras distintas que restarem.

### Limitação conhecida

`initialize` pode ser chamada por qualquer carteira, uma única vez. Por isso o deploy e a inicialização devem ser feitos em sequência pelo admin, como foi feito na Devnet. Para produção, a instrução deve exigir que quem chama seja a *upgrade authority* do programa.

O oráculo da MagicBlock pode entregar a mesma resposta mais de uma vez. As entregas repetidas falham dentro do próprio programa VRF (erro `0x1`) e aparecem como transações com erro no histórico da piñata. Isso é normal e não custa nada ao Pinata.

### Ciclo de uma piñata

```
Open ──(meta ou mínimo atingido)──> Drawing ──(VRF)──> Drawn ──(settle)──> fechada
  │
  └─(sem bilhetes)── settle direto: 50% plataforma, 50% pool
```

## 5. API e banco de dados

API em Rust (Axum + SQLx) com PostgreSQL 18. O esquema completo e comentado está em `api/migrations/0001_init.sql`.

| Tabela | Conteúdo |
| --- | --- |
| `users` | carteira (única), username, nome, bio, avatar, se é perfil de demonstração |
| `auth_nonces` | mensagens de login a assinar (uso único, valem 10 minutos) |
| `sessions` | sessões de login; só o hash SHA-256 do token é guardado |
| `posts` | autor, conteúdo, contadores de curtidas e descurtidas |
| `comments` | id (também enviado on-chain), post, carteira que pagou, conteúdo, valor, status (`pending`/`confirmed`/`failed`), rodada da piñata, assinatura da transação (única) |
| `votes` | um voto (+1/-1) por conta e post; os contadores do post mudam na mesma transação |
| `pinata_winners` | histórico de vencedores (a conta da piñata é fechada on-chain depois do pagamento) |

### Login com a carteira

1. `POST /auth/nonce`: a API devolve uma mensagem no formato *Sign In With Solana*, com um código de uso único.
2. A carteira assina a mensagem. É grátis, não é uma transação e não move SOL.
3. `POST /auth/verify`: a API confere a assinatura ed25519 com o endereço da carteira, cria a conta no primeiro login e abre a sessão num cookie HttpOnly válido por 30 dias.

### Comentário pago

1. `POST /posts/{id}/comments`:
   - a API confere que o autor tem piñata aberta e que o valor é pelo menos o mínimo;
   - guarda o comentário como `pending`;
   - devolve as contas para montar o `pay_comment`.
2. A carteira assina e envia o `pay_comment`, com o id do comentário dentro da transação.
3. `POST /comments/{id}/confirm` com a assinatura da transação:
   - a API lê a transação na Solana e confere programa, id do comentário, carteira, criador, piñata e valor;
   - só então publica o comentário.
   - Uma transação nunca publica dois comentários (assinatura única).
   - Comentários `pending` não pagos expiram em 1 hora.

### Vencedores **[decisão técnica]**

Por enquanto, a tabela `pinata_winners` só tem os dados de demonstração. A automação da fase 5 vai preenchê-la a cada `settle`.

## 6. Dados de demonstração

`pinata-api seed` carrega os perfis, posts, comentários e vencedores de `pinata_front/data/mockData.ts`:

- **Carteira de cada perfil:** a chave fica em `keys/demo/`, fora do Git.
- **Piñatas reais na Devnet:** `pinata-cli demo-pinatas` abre uma para cada perfil (meta de 1 SOL, estouro antecipado a partir de 60%), então os posts de demonstração recebem comentários pagos de verdade.
- **Perfil `samirdourado`:** pertence à carteira `DEMO_OWNER_WALLET` (a samirdev). O Samir entra com ela e posta como esse perfil.
- **Dados sem pagamento:** os comentários e vencedores de demonstração nunca foram pagos on-chain, por isso não têm assinatura de transação.

## 7. Fases

1. **Programa Anchor + testes locais** (LiteSVM) e ambiente de build em Docker
2. **Deploy na Devnet e teste do sorteio com a VRF real** (feito em 02/11/2026: o oráculo respondeu em cerca de 2 s; os endereços estão no README)
3. **API em Rust (Axum + SQLx) + PostgreSQL, com migrations e seed dos dados de demonstração** (feito em 02/11/2026; testada de ponta a ponta com um comentário pago na Devnet)
4. Frontend: trocar o `localStorage` pela API e fazer os pagamentos reais
5. Automação: estouros ao atingir 100% e no dia 1º

## 8. Versões e testes

- Ferramentas: imagem Docker oficial `solanafoundation/anchor:v1.0.2` (Anchor CLI 1.0.2, Solana CLI 3.1.10)
- Crate `anchor-lang` **1.2.2**. As macros do Anchor sempre resolvem para a versão 1.x mais nova, e fixar a `anchor-lang` em 1.0.2 quebra o build.
- VRF: crate `ephemeral-vrf-sdk` 0.17.3 (feature `anchor`), só a parte de VRF do SDK da MagicBlock
- Rede: Solana **Devnet**

**Testes** (`programs/pinata/tests/`, em Rust com **LiteSVM**, uma blockchain Solana simulada na memória):

- carregam o programa compilado (`target/deploy/pinata.so`) e também o **programa VRF real da MagicBlock** com a fila do oráculo, copiados da Devnet para `tests/fixtures/`. Assim, os pedidos de sorteio passam pelo programa verdadeiro.
- simulam a resposta do oráculo assinando como a identidade da VRF (os testes desligam a verificação de assinaturas, como só uma blockchain de teste permite);
- conferem cada lamport da divisão dos pagamentos, as regras de estouro, o dia 1º no fuso de Brasília, o sorteio e o pagamento.

Os testes unitários de `draw.rs` e `calendar.rs` cobrem o sorteio e o calendário sem blockchain.
