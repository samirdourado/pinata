"""Narration, subtitles, and screen plan for the Pinata pitch and demo videos.

Each scene shows one app capture from `rendered/` and holds a list of
(English, Brazilian Portuguese) sentence pairs. The English video narrates and
subtitles the English sentences; the pt-BR video does the same with the Portuguese ones.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Scene:
    screen: str
    chapter_en: str
    chapter_pt: str
    lines: tuple[tuple[str, str], ...]
    # Optional zoom: (left, top, width) in capture pixels; height follows 16:9.
    crop: tuple[int, int, int] | None = None


PITCH: list[Scene] = [
    Scene(
        "guest-home.png", "The problem", "O problema",
        (
            ("Social feeds are drowning in spam, bots, and low-effort replies.",
             "As redes sociais estão afogadas em spam, bots e respostas sem esforço."),
            ("Commenting is free, so noise is free too.",
             "Comentar é de graça, então o ruído também é."),
            ("Creators generate all of the engagement, but platforms capture almost all of the value.",
             "Criadores geram todo o engajamento, mas as plataformas ficam com quase todo o valor."),
            ("The people who start the best conversations rarely get paid for them.",
             "Quem começa as melhores conversas raramente é recompensado por isso."),
        ),
    ),
    Scene(
        "home.png", "The solution", "A solução",
        (
            ("Pinata is a SocialFi protocol designed for Solana.",
             "Pinata é um protocolo SocialFi projetado para a Solana."),
            ("Posting is free, but every public comment carries a tiny fee, starting at five thousandths of a SOL.",
             "Publicar é grátis, mas cada comentário público tem uma pequena taxa, a partir de 0,005 SOL."),
        ),
    ),
    Scene(
        "composer.png", "The solution", "A solução",
        (
            ("That small cost filters out spam and bots, and turns every reply into a deliberate, meaningful action.",
             "Esse custo pequeno filtra spam e bots, e transforma cada resposta em uma ação deliberada e relevante."),
        ),
    ),
    Scene(
        "comment-posted.png", "Piñata rewards", "Recompensas Piñata",
        (
            ("Each fee is shared between the creator, the platform, and the creator's Piñata, which receives forty percent.",
             "Cada taxa é dividida entre o criador, a plataforma e a Piñata do criador, que recebe quarenta por cento."),
        ),
    ),
    Scene(
        "dashboard.png", "Piñata rewards", "Recompensas Piñata",
        (
            ("The Piñata is a gamified prize pool on every creator profile.",
             "A Piñata é um prêmio gamificado presente no perfil de cada criador."),
            ("Once it reaches sixty percent of its target, the creator can burst it.",
             "Quando ela atinge sessenta por cento da meta, o criador pode estourá-la."),
        ),
        crop=(160, 120, 1600),
    ),
    Scene(
        "dashboard-burst.png", "Piñata rewards", "Recompensas Piñata",
        (
            ("The reward goes to a community member who commented during that round.",
             "O prêmio vai para um membro da comunidade que comentou naquela rodada."),
            ("On top of that, a platform-wide Piñata Pool, funded by protocol fees, runs a monthly draw for active commenters.",
             "Além disso, um Piñata Pool de toda a plataforma, financiado pelas taxas do protocolo, faz um sorteio mensal entre comentaristas ativos."),
            ("Creators earn from conversation, commenters are rewarded for showing up, and quality wins over volume.",
             "Criadores ganham com a conversa, comentaristas são recompensados por participar, e a qualidade vence o volume."),
        ),
        crop=(160, 120, 1600),
    ),
    Scene(
        "register-filled.png", "MVP today", "MVP hoje",
        (
            ("Our MVP is live on Vercel.",
             "Nosso MVP está no ar na Vercel."),
            ("Since our first submission, we added account registration, sign-in, a personal dashboard, and activity that persists in the browser.",
             "Desde a primeira submissão, adicionamos cadastro de conta, login, um dashboard pessoal e atividade que persiste no navegador."),
        ),
    ),
    Scene(
        "wallet.png", "MVP today", "MVP hoje",
        (
            ("To be clear: the wallet connection and SOL payments are simulated today.",
             "Para deixar claro: a conexão de carteira e os pagamentos em SOL são simulados hoje."),
            ("No transaction touches the blockchain yet, so we can validate the full user experience first.",
             "Nenhuma transação toca a blockchain ainda, assim validamos primeiro a experiência completa do usuário."),
        ),
    ),
    Scene(
        "trending.png", "Roadmap on Solana", "Roadmap na Solana",
        (
            ("Next, we connect real Solana wallets through the wallet adapter.",
             "O próximo passo é conectar carteiras Solana reais pelo wallet adapter."),
            ("Fees and Piñatas move into an Anchor program with PDAs on Devnet, with verifiable randomness for fair draws.",
             "Taxas e Piñatas passam para um programa Anchor com PDAs na Devnet, com aleatoriedade verificável para sorteios justos."),
        ),
    ),
    Scene(
        "creator.png", "Composability", "Composabilidade",
        (
            ("Built on Solana primitives, Pinata can accept USDC or community tokens, and share paid comments as Blinks anywhere on the web.",
             "Construído sobre primitivas da Solana, o Pinata pode aceitar USDC ou tokens de comunidades e compartilhar comentários pagos como Blinks em qualquer lugar da web."),
        ),
    ),
    Scene(
        "guest-home.png", "Go to market", "Go-to-market",
        (
            ("We start with Brazilian crypto communities through Superteam Brasil, onboarding creators who already have engaged audiences.",
             "Começamos pelas comunidades cripto do Brasil, com a Superteam Brasil, trazendo criadores que já têm audiências engajadas."),
            ("Then we expand to creators across Latin America.",
             "Depois expandimos para criadores de toda a América Latina."),
            ("Revenue comes from a small protocol share of every paid comment, so Pinata only grows when conversations create value.",
             "A receita vem de uma pequena parte do protocolo em cada comentário pago, então o Pinata só cresce quando as conversas geram valor."),
        ),
    ),
    Scene(
        "home.png", "The vision", "A visão",
        (
            ("Pinata turns comments into value for creators and communities.",
             "O Pinata transforma comentários em valor para criadores e comunidades."),
            ("Help us build a better social layer on Solana.",
             "Venha construir com a gente uma camada social melhor na Solana."),
        ),
    ),
]


DEMO: list[Scene] = [
    Scene(
        "guest-home.png", "Welcome", "Boas-vindas",
        (
            ("This is Pinata, live on Vercel.",
             "Este é o Pinata, no ar na Vercel."),
            ("Before signing in, visitors can see the Piñata Pool, the trending posts, and how the protocol works.",
             "Antes de entrar, o visitante vê o Piñata Pool, os posts em alta e como o protocolo funciona."),
            ("A note up front: this is a frontend prototype. The wallet and all SOL amounts are simulated, and nothing is sent on-chain yet.",
             "Um aviso logo de início: este é um protótipo de frontend. A carteira e todos os valores em SOL são simulados, e nada é enviado on-chain ainda."),
        ),
    ),
    Scene(
        "register-filled.png", "New: accounts", "Novo: contas",
        (
            ("New in this version: account registration.",
             "Novidade desta versão: cadastro de conta."),
            ("Maria enters a name, username, email, optional bio, and a six to twelve character password, all validated with Zod.",
             "A Maria informa nome, username, e-mail, bio opcional e uma senha de seis a doze caracteres, tudo validado com Zod."),
        ),
    ),
    Scene(
        "home.png", "New: accounts", "Novo: contas",
        (
            ("After signing up, she lands on the feed with the full navigation: Home, Trending Posts, Profile, Dashboard, and Notifications.",
             "Depois do cadastro, ela chega ao feed com a navegação completa: Home, Trending Posts, Perfil, Dashboard e Notificações."),
        ),
    ),
    Scene(
        "wallet.png", "Simulated wallet", "Carteira simulada",
        (
            ("Connect Wallet simulates a Solana wallet session, with a sample address and balance.",
             "O botão Connect Wallet simula uma sessão de carteira Solana, com endereço e saldo de exemplo."),
        ),
    ),
    Scene(
        "trending.png", "Feed and votes", "Feed e votos",
        (
            ("Trending Posts ranks the feed by vote balance, and upvotes and downvotes stay in sync across every view.",
             "Trending Posts ordena o feed pelo saldo de votos, e os votos positivos e negativos ficam sincronizados em todas as telas."),
        ),
    ),
    Scene(
        "post-detail.png", "Feed and votes", "Feed e votos",
        (
            ("Opening a post shows the full discussion. Each comment shows the value paid, and the post shows what it added to the Piñata.",
             "Ao abrir um post vemos a discussão completa. Cada comentário mostra o valor pago, e o post mostra quanto somou à Piñata."),
        ),
    ),
    Scene(
        "creator-compose.png", "Free posts", "Posts grátis",
        (
            ("On her profile, Maria publishes a new post for free.",
             "No perfil, a Maria publica um novo post, de graça."),
        ),
    ),
    Scene(
        "creator-post.png", "Free posts", "Posts grátis",
        (
            ("The post shows up right away on her profile and in the feed.",
             "O post aparece na hora no perfil dela e no feed."),
        ),
    ),
    Scene(
        "composer.png", "Paid comments", "Comentários pagos",
        (
            ("Now Lucas, a second user, comments on it. He picks the value, minimum 0.005 SOL, and pays a simulated 1.5 SOL.",
             "Agora o Lucas, um segundo usuário, comenta. Ele escolhe o valor, mínimo de 0,005 SOL, e paga 1,5 SOL simulados."),
        ),
    ),
    Scene(
        "comment-posted.png", "Paid comments", "Comentários pagos",
        (
            ("The comment appears instantly, and forty percent of its value, 0.6 SOL, flows into Maria's creator Piñata.",
             "O comentário aparece na hora, e quarenta por cento do valor, 0,6 SOL, vai para a Piñata de criadora da Maria."),
        ),
    ),
    Scene(
        "dashboard-commenter.png", "Dashboard", "Dashboard",
        (
            ("Lucas's dashboard tracks his published posts, paid comments, and total comment value.",
             "O dashboard do Lucas acompanha posts publicados, comentários pagos e o valor total dos comentários."),
        ),
        crop=(160, 120, 1600),
    ),
    Scene(
        "login-filled.png", "Sign in", "Login",
        (
            ("Maria signs back in with her email or username.",
             "A Maria entra de novo com e-mail ou username."),
            ("Passwords are stored as salted PBKDF2 hashes, and the session persists in local storage.",
             "As senhas são guardadas como hashes PBKDF2 com salt, e a sessão persiste no localStorage."),
        ),
    ),
    Scene(
        "dashboard.png", "Creator Piñata", "Piñata do criador",
        (
            ("Her Piñata now holds 0.6 of 1 SOL. That reaches the sixty percent threshold, so the Burst button unlocks.",
             "A Piñata dela agora tem 0,6 de 1 SOL. Isso atinge o limite de sessenta por cento, e o botão Burst é liberado."),
        ),
        crop=(160, 120, 1600),
    ),
    Scene(
        "dashboard-burst.png", "Creator Piñata", "Piñata do criador",
        (
            ("She bursts the Piñata. An eligible commenter from this round is drawn, and Lucas receives 0.6 SOL.",
             "Ela estoura a Piñata. Um comentarista elegível desta rodada é sorteado, e o Lucas recebe 0,6 SOL."),
            ("The draw is saved under Recent rewards, and a new round begins.",
             "O sorteio fica registrado em Recent rewards, e uma nova rodada começa."),
        ),
        crop=(160, 120, 1600),
    ),
    Scene(
        "creator.png", "Persistence", "Persistência",
        (
            ("Everything survives a page refresh: accounts, posts, votes, comments, and Piñata history.",
             "Tudo continua após recarregar a página: contas, posts, votos, comentários e o histórico da Piñata."),
        ),
    ),
    Scene(
        "home.png", "Next on Solana", "Próximo passo na Solana",
        (
            ("Next on Solana: the wallet adapter for real signatures, an Anchor program holding fees and Piñatas in PDAs on Devnet, and verifiable randomness for the draws.",
             "Próximo passo na Solana: wallet adapter para assinaturas reais, um programa Anchor guardando taxas e Piñatas em PDAs na Devnet, e aleatoriedade verificável nos sorteios."),
        ),
    ),
]


TITLES = {
    "pitch": {
        "en": ("The pitch", "Pinata", "Better conversations. Shared rewards. A SocialFi protocol designed for Solana."),
        "pt-BR": ("O pitch", "Pinata", "Conversas melhores. Recompensas compartilhadas. Um protocolo SocialFi projetado para a Solana."),
    },
    "demo": {
        "en": ("Product demo", "Pinata", "Accounts, paid comments, and the Creator Piñata. Wallet and payments are simulated."),
        "pt-BR": ("Demo do produto", "Pinata", "Contas, comentários pagos e a Piñata do criador. Carteira e pagamentos são simulados."),
    },
    "outro": {
        "en": ("pinata-zeta.vercel.app", "Built for better conversations", "Working MVP today, with simulated wallet. On-chain SocialFi on Solana next."),
        "pt-BR": ("pinata-zeta.vercel.app", "Feito para conversas melhores", "MVP funcionando hoje, com carteira simulada. SocialFi on-chain na Solana em seguida."),
    },
}
