import { iPost } from "@/interface/post";

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
];