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

- Só quem **posta** precisa se cadastrar (o criador). A conta do criador fica vinculada a uma carteira.
- **Qualquer pessoa comenta**, inclusive anônima: basta pagar com uma carteira. A carteira é a identidade do comentarista.
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

`initialize` pode ser chamada por qualquer carteira, uma única vez. Por isso o deploy e a inicialização devem ser feitos em sequência pelo admin. Para produção, a instrução deve exigir que quem chama seja a *upgrade authority* do programa.

### Ciclo de uma piñata

```
Open ──(meta ou mínimo atingido)──> Drawing ──(VRF)──> Drawn ──(settle)──> fechada
  │
  └─(sem bilhetes)── settle direto: 50% plataforma, 50% pool
```

## 5. Banco de dados (fase 3, rascunho)

- `creators`: id, username, nome, e-mail, hash da senha, bio, avatar, carteira, criado_em
- `posts`: id, creator_id, conteúdo, criado_em
- `comments`: id (UUID, também enviado on-chain), post_id, carteira do comentarista, conteúdo, valor em lamports, assinatura da transação, status (`pending`/`confirmed`/`failed`), rodada da piñata, criado_em, confirmado_em
- `votes`: post_id, carteira ou criador, valor (+1/-1), único por votante e post
- `pinata_rounds` e `pinata_winners`: espelho do que aconteceu on-chain, para exibir rápido

Fluxo de um comentário: o frontend pede à API um `comment_id` → a carteira assina `pay_comment` com esse id → a API confere a transação na Solana → o comentário é publicado.

## 6. Fases

1. **Programa Anchor + testes locais** (LiteSVM) e ambiente de build em Docker
2. Deploy na Devnet e teste do sorteio com a VRF real
3. API em Rust (Axum + SQLx) + PostgreSQL, com migrations e seed dos dados de demonstração
4. Frontend: trocar o `localStorage` pela API e fazer os pagamentos reais
5. Automação: estouros ao atingir 100% e no dia 1º

## 7. Versões e testes

- Ferramentas: imagem Docker oficial `solanafoundation/anchor:v1.0.2` (Anchor CLI 1.0.2, Solana CLI 3.1.10)
- Crate `anchor-lang` **1.2.2**. As macros do Anchor sempre resolvem para a versão 1.x mais nova, e fixar a `anchor-lang` em 1.0.2 quebra o build.
- VRF: crate `ephemeral-vrf-sdk` 0.17.3 (feature `anchor`), só a parte de VRF do SDK da MagicBlock
- Rede: Solana **Devnet**

**Testes** (`programs/pinata/tests/`, em Rust com **LiteSVM**, uma blockchain Solana simulada na memória):

- carregam o programa compilado (`target/deploy/pinata.so`) e também o **programa VRF real da MagicBlock** com a fila do oráculo, copiados da Devnet para `tests/fixtures/`. Assim, os pedidos de sorteio passam pelo programa verdadeiro.
- simulam a resposta do oráculo assinando como a identidade da VRF (os testes desligam a verificação de assinaturas, como só uma blockchain de teste permite);
- conferem cada lamport da divisão dos pagamentos, as regras de estouro, o dia 1º no fuso de Brasília, o sorteio e o pagamento.

Os testes unitários de `draw.rs` e `calendar.rs` cobrem o sorteio e o calendário sem blockchain.
