# Demo Video Script (English)

Video: [watch on YouTube](https://www.youtube.com/watch?v=Un_GRtISO6M) (about 2:45). Narration and subtitles in English: [`demo-video-en.srt`](demo-video-en.srt).

> Prototype status when the video was recorded (the wallet connection is now real, on Devnet): wallet connection and all SOL payments are **simulated** in the frontend. Accounts and activity are stored in the browser's `localStorage`. No transaction is sent to Solana yet.

## Welcome

*Screen: `guest-home.png`*

This is Pinata, live on Vercel. Before signing in, visitors can see the Piñata Pool, the trending posts, and how the protocol works. A note up front: this is a frontend prototype. The wallet and all SOL amounts are simulated, and nothing is sent on-chain yet.

## New: accounts

*Screen: `register-filled.png`*

New in this version: account registration. Maria enters a name, username, email, optional bio, and a six to twelve character password, all validated with Zod.

*Screen: `home.png`*

After signing up, she lands on the feed with the full navigation: Home, Trending Posts, Profile, Dashboard, and Notifications.

## Simulated wallet

*Screen: `wallet.png`*

Connect Wallet simulates a Solana wallet session, with a sample address and balance.

## Feed and votes

*Screen: `trending.png`*

Trending Posts ranks the feed by vote balance, and upvotes and downvotes stay in sync across every view.

*Screen: `post-detail.png`*

Opening a post shows the full discussion. Each comment shows the value paid, and the post shows what it added to the Piñata.

## Free posts

*Screen: `creator-compose.png`*

On her profile, Maria publishes a new post for free.

*Screen: `creator-post.png`*

The post shows up right away on her profile and in the feed.

## Paid comments

*Screen: `composer.png`*

Now Lucas, a second user, comments on it. He picks the value, minimum 0.005 SOL, and pays a simulated 1.5 SOL.

*Screen: `comment-posted.png`*

The comment appears instantly, and forty percent of its value, 0.6 SOL, flows into Maria's creator Piñata.

## Dashboard

*Screen: `dashboard-commenter.png`*

Lucas's dashboard tracks his published posts, paid comments, and total comment value.

## Sign in

*Screen: `login-filled.png`*

Maria signs back in with her email or username. Passwords are stored as salted PBKDF2 hashes, and the session persists in local storage.

## Creator Piñata

*Screen: `dashboard.png`*

Her Piñata now holds 0.6 of 1 SOL. That reaches the sixty percent threshold, so the Burst button unlocks.

*Screen: `dashboard-burst.png`*

She bursts the Piñata. An eligible commenter from this round is drawn, and Lucas receives 0.6 SOL. The draw is saved under Recent rewards, and a new round begins.

## Persistence

*Screen: `creator.png`*

Everything survives a page refresh: accounts, posts, votes, comments, and Piñata history.

## Next on Solana

*Screen: `home.png`*

Next on Solana: the wallet adapter for real signatures, an Anchor program holding fees and Piñatas in PDAs on Devnet, and verifiable randomness for the draws.

---

# Roteiro do Vídeo de Demo (pt-BR)

Vídeo publicado: [assista no YouTube](https://www.youtube.com/watch?v=Un_GRtISO6M), em inglês. Este roteiro é a versão em português, e as legendas em português estão em [`demo-video-pt-BR.srt`](demo-video-pt-BR.srt), sincronizadas com a narração em português.

> Status do protótipo: a conexão de carteira e todos os pagamentos em SOL são **simulados** no frontend. Contas e atividade ficam no `localStorage` do navegador. Nenhuma transação é enviada para a Solana ainda.

## Boas-vindas

*Tela: `guest-home.png`*

Este é o Pinata, no ar na Vercel. Antes de entrar, o visitante vê o Piñata Pool, os posts em alta e como o protocolo funciona. Um aviso logo de início: este é um protótipo de frontend. A carteira e todos os valores em SOL são simulados, e nada é enviado on-chain ainda.

## Novo: contas

*Tela: `register-filled.png`*

Novidade desta versão: cadastro de conta. A Maria informa nome, username, e-mail, bio opcional e uma senha de seis a doze caracteres, tudo validado com Zod.

*Tela: `home.png`*

Depois do cadastro, ela chega ao feed com a navegação completa: Home, Trending Posts, Perfil, Dashboard e Notificações.

## Carteira simulada

*Tela: `wallet.png`*

O botão Connect Wallet simula uma sessão de carteira Solana, com endereço e saldo de exemplo.

## Feed e votos

*Tela: `trending.png`*

Trending Posts ordena o feed pelo saldo de votos, e os votos positivos e negativos ficam sincronizados em todas as telas.

*Tela: `post-detail.png`*

Ao abrir um post vemos a discussão completa. Cada comentário mostra o valor pago, e o post mostra quanto somou à Piñata.

## Posts grátis

*Tela: `creator-compose.png`*

No perfil, a Maria publica um novo post, de graça.

*Tela: `creator-post.png`*

O post aparece na hora no perfil dela e no feed.

## Comentários pagos

*Tela: `composer.png`*

Agora o Lucas, um segundo usuário, comenta. Ele escolhe o valor, mínimo de 0,005 SOL, e paga 1,5 SOL simulados.

*Tela: `comment-posted.png`*

O comentário aparece na hora, e quarenta por cento do valor, 0,6 SOL, vai para a Piñata de criadora da Maria.

## Dashboard

*Tela: `dashboard-commenter.png`*

O dashboard do Lucas acompanha posts publicados, comentários pagos e o valor total dos comentários.

## Login

*Tela: `login-filled.png`*

A Maria entra de novo com e-mail ou username. As senhas são guardadas como hashes PBKDF2 com salt, e a sessão persiste no localStorage.

## Piñata do criador

*Tela: `dashboard.png`*

A Piñata dela agora tem 0,6 de 1 SOL. Isso atinge o limite de sessenta por cento, e o botão Burst é liberado.

*Tela: `dashboard-burst.png`*

Ela estoura a Piñata. Um comentarista elegível desta rodada é sorteado, e o Lucas recebe 0,6 SOL. O sorteio fica registrado em Recent rewards, e uma nova rodada começa.

## Persistência

*Tela: `creator.png`*

Tudo continua após recarregar a página: contas, posts, votos, comentários e o histórico da Piñata.

## Próximo passo na Solana

*Tela: `home.png`*

Próximo passo na Solana: wallet adapter para assinaturas reais, um programa Anchor guardando taxas e Piñatas em PDAs na Devnet, e aleatoriedade verificável nos sorteios.
