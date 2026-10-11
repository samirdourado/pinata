import { iPost } from "@/interface/post";
import { iProfile, iProfileWinner } from "@/interface/profile";

export const CURRENT_USER_HANDLE = "samirdourado";

export const INITIAL_POSTS: iPost[] = [
  {
    id: 'post-1',
    author: 'Samir Dourado',
    handle: 'samirdourado',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Samir',
    content: 'Qual a opinião de vocês sobre utilizar micropagamentos em redes sociais para acabar com bots e spam? O modelo Pay-to-Comment faz sentido para criadores?',
    likes: 42,
    dislikes: 3,
    commentFeeSol: 0.005,
    pinataPoolSol: 0.125,
    createdAt: 'Há 2 horas',
    comments: [
      {
        id: 'c-1',
        author: 'CryptoDev',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev',
        content: 'Acredito que a barreira financeira elimina 99% dos bots. O segredo é manter a taxa bem baixa (centavos) para não afastar usuários reais.',
        paidAmountSol: 0.005,
        timestamp: 'Há 1 hora',
      },
      {
        id: 'c-2',
        author: 'Web3Builder',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder',
        content: 'O sistema de sorteio da Piñata no final da semana é um baita incentivo para engajamento!',
        paidAmountSol: 0.005,
        timestamp: 'Há 30 min',
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Superteam Brasil',
    handle: 'superteambr',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Superteam',
    content: 'O Colosseum Hackathon começou! Quais projetos vocês estão construindo no ecossistema Solana?',
    likes: 128,
    dislikes: 1,
    commentFeeSol: 0.01,
    pinataPoolSol: 0.45,
    createdAt: 'Há 5 horas',
    comments: [],
  },
  {
    id: 'post-3',
    author: 'Samir Dourado',
    handle: 'samirdourado',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Samir',
    content: 'Uma boa conversa online merece mais que uma reação rápida. Que mecanismos ajudam a recompensar quem contribui com contexto e experiência?',
    likes: 86,
    dislikes: 4,
    commentFeeSol: 0.005,
    pinataPoolSol: 0.21,
    createdAt: 'Ontem',
    comments: [],
  },
  {
    id: 'post-4',
    author: 'CryptoDev',
    handle: 'cryptodev',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev',
    content: 'Estou testando um modelo de reputação que combina votos, qualidade das respostas e participação recorrente. Como evitar que uma métrica única seja manipulada?',
    likes: 64,
    dislikes: 2,
    commentFeeSol: 0.005,
    pinataPoolSol: 0.18,
    createdAt: 'Há 1 dia',
    comments: [],
  },
  {
    id: 'post-5',
    author: 'Web3Builder',
    handle: 'web3builder',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder',
    content: 'Quais métricas vocês acompanhariam para saber se uma comunidade está realmente saudável, além do número de membros?',
    likes: 51,
    dislikes: 1,
    commentFeeSol: 0.01,
    pinataPoolSol: 0.32,
    createdAt: 'Há 2 dias',
    comments: [],
  },
];

export const PROFILES: iProfile[] = [
  {
    name: 'Samir Dourado',
    handle: 'samirdourado',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Samir',
    bio: 'Construindo comunidades melhores no ecossistema Solana.',
    memberSince: 'Março de 2025',
    pinataBalanceSol: 0.62,
    pinataTargetSol: 1,
  },
  {
    name: 'Superteam Brasil',
    handle: 'superteambr',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Superteam',
    bio: 'Apoiando builders e talentos do ecossistema Solana no Brasil.',
    memberSince: 'Janeiro de 2025',
    pinataBalanceSol: 0.31,
    pinataTargetSol: 1,
  },
  {
    name: 'CryptoDev',
    handle: 'cryptodev',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev',
    bio: 'Desenvolvedor explorando produtos on-chain e experiências sociais.',
    memberSince: 'Abril de 2025',
    pinataBalanceSol: 0.44,
    pinataTargetSol: 1,
  },
  {
    name: 'Web3Builder',
    handle: 'web3builder',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder',
    bio: 'Compartilhando aprendizados sobre produtos e comunidades Web3.',
    memberSince: 'Fevereiro de 2025',
    pinataBalanceSol: 0.78,
    pinataTargetSol: 1,
  },
];

export const RECENT_WINNERS = [
  {
    name: 'Ana Souza',
    handle: 'anasouza',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ana',
    prize: '0.42',
  },
  {
    name: 'CryptoDev',
    handle: 'cryptodev',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev',
    prize: '0.28',
  },
  {
    name: 'Web3Builder',
    handle: 'web3builder',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder',
    prize: '0.19',
  },
];

export const PROFILE_WINNERS: Record<string, iProfileWinner[]> = {
  samirdourado: [
    {
      id: "samir-winner-1",
      name: "CryptoDev",
      handle: "cryptodev",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev",
      prizeSol: 0.18,
      createdAt: "2026-10-02T12:00:00.000Z",
    },
    {
      id: "samir-winner-2",
      name: "Web3Builder",
      handle: "web3builder",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
      prizeSol: 0.12,
      createdAt: "2026-09-24T12:00:00.000Z",
    },
  ],
  superteambr: [],
  cryptodev: [],
  web3builder: [],
};