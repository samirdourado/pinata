import { iPost } from "@/interface/post";
import { iProfile, iProfileWinner } from "@/interface/profile";

export const CURRENT_USER_HANDLE = "samirdourado";

export const INITIAL_POSTS: iPost[] = [
  {
    id: "post-1",
    author: "Samir Dourado",
    handle: "samirdourado",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
    content:
      "What do you think about using micropayments in social networks to eliminate bots and spam? Does the Pay-to-Comment model make sense for creators?",
    likes: 42,
    dislikes: 3,
    commentFeeSol: 0.005,
    pinataPoolSol: 0.125,
    createdAt: "2 hours ago",
    comments: [
      {
        id: "c-1",
        author: "CryptoDev",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev",
        content:
          "I believe the financial barrier removes 99% of bots. The key is keeping the fee low enough (a few cents) to avoid repelling real users.",
        paidAmountSol: 0.005,
        timestamp: "1 hour ago",
        handle: "cryptodev",
        createdAt: "2026-10-11T00:15:00.000Z",
      },
      {
        id: "c-2",
        author: "Web3Builder",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
        content:
          "The Piñata raffle at the end of the week is a great incentive for engagement!",
        paidAmountSol: 0.005,
        timestamp: "30 minutes ago",
        handle: "web3builder",
        createdAt: "2026-10-11T00:45:00.000Z",
      },
      {
        id: "c-3",
        author: "Ana Souza",
        handle: "anasouza",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
        content:
          "The fee can work as a signal of intent as long as the amount stays accessible and transparent.",
        paidAmountSol: 0.4,
        timestamp: "22 minutes ago",
        createdAt: "2026-10-11T00:53:00.000Z",
      },
      {
        id: "c-4",
        author: "SolanaFan",
        handle: "solanafan",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SolanaFan",
        content:
          "It would also be helpful to show exactly where each share of the payment goes. That builds trust.",
        paidAmountSol: 0.4,
        timestamp: "18 minutes ago",
        createdAt: "2026-10-11T00:57:00.000Z",
      },
      {
        id: "c-5",
        author: "ProdutoDAO",
        handle: "produtodao",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ProdutoDAO",
        content:
          "A small free daily allowance alongside the fee could also welcome new users.",
        paidAmountSol: 0.4,
        timestamp: "12 minutes ago",
        createdAt: "2026-10-11T01:03:00.000Z",
      },
      {
        id: "c-6",
        author: "Superteam Brasil",
        handle: "superteambr",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Superteam",
        content:
          "Transparency in the rules and allocation will be essential for the community to participate.",
        paidAmountSol: 0.4,
        timestamp: "7 minutes ago",
        createdAt: "2026-10-11T01:08:00.000Z",
      },
    ],
  },
  {
    id: "post-2",
    author: "Superteam Brasil",
    handle: "superteambr",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Superteam",
    content:
      "The Colosseum Hackathon has started! What projects are you building in the Solana ecosystem?",
    likes: 128,
    dislikes: 2,
    commentFeeSol: 0.01,
    pinataPoolSol: 0.45,
    createdAt: "5 hours ago",
    comments: [
      {
        id: "c-7",
        author: "Samir Dourado",
        handle: "samirdourado",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
        content:
          "I'm building a community experience focused on conversations that truly add value.",
        paidAmountSol: 0.08,
        timestamp: "3 hours ago",
        createdAt: "2026-10-11T02:30:00.000Z",
      },
      {
        id: "c-8",
        author: "Ana Souza",
        handle: "anasouza",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
        content:
          "We're building tools to support local builders. What kind of meetup would be most useful?",
        paidAmountSol: 0.2,
        timestamp: "2 hours ago",
        createdAt: "2026-10-11T03:30:00.000Z",
      },
      {
        id: "c-9",
        author: "ProdutoDAO",
        handle: "produtodao",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ProdutoDAO",
        content:
          "Short product review sessions often spark really useful conversations.",
        paidAmountSol: 0.15,
        timestamp: "1 hour ago",
        createdAt: "2026-10-11T04:00:00.000Z",
      },
      {
        id: "c-10",
        author: "SolanaFan",
        handle: "solanafan",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SolanaFan",
        content:
          "A track for newcomers would likely have strong demand too.",
        paidAmountSol: 0.1,
        timestamp: "40 minutes ago",
        createdAt: "2026-10-11T04:20:00.000Z",
      },
    ],
  },
  {
    id: "post-3",
    author: "Samir Dourado",
    handle: "samirdourado",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
    content:
      "A good online conversation deserves more than a quick reaction. What mechanisms help reward people who contribute context and experience?",
    likes: 86,
    dislikes: 4,
    commentFeeSol: 0.005,
    pinataPoolSol: 0.21,
    createdAt: "Yesterday",
    comments: [],
  },
  {
    id: "post-4",
    author: "CryptoDev",
    handle: "cryptodev",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev",
    content:
      "I'm testing a reputation model that combines votes, response quality, and recurring participation. How can we prevent a single metric from being manipulated?",
    likes: 64,
    dislikes: 2,
    commentFeeSol: 0.005,
    pinataPoolSol: 0.18,
    createdAt: "1 day ago",
    comments: [
      {
        id: "c-11",
        author: "Samir Dourado",
        handle: "samirdourado",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
        content:
          "Reputation needs to be explainable so people understand how to improve.",
        paidAmountSol: 0.02,
        timestamp: "1 day ago",
        createdAt: "2026-10-10T09:00:00.000Z",
      },
      {
        id: "c-12",
        author: "Ana Souza",
        handle: "anasouza",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
        content:
          "I would separate quality and frequency so we don't only favor people who live on the platform.",
        paidAmountSol: 0.025,
        timestamp: "20 hours ago",
        createdAt: "2026-10-10T13:00:00.000Z",
      },
    ],
  },
  {
    id: "post-5",
    author: "Web3Builder",
    handle: "web3builder",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
    content:
      "Which metrics would you track to know if a community is truly healthy beyond just member count?",
    likes: 64,
    dislikes: 2,
    commentFeeSol: 0.01,
    pinataPoolSol: 0.32,
    createdAt: "2 days ago",
    comments: [
      {
        id: "c-13",
        author: "Web3Builder",
        handle: "web3builder",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
        content:
          "Retention of contributors and answer quality are good signals.",
        paidAmountSol: 0.015,
        timestamp: "2 days ago",
        createdAt: "2026-10-09T09:00:00.000Z",
      },
      {
        id: "c-14",
        author: "SolanaFan",
        handle: "solanafan",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SolanaFan",
        content:
          "It also helps to track how many people return to answer after the first interaction.",
        paidAmountSol: 0.015,
        timestamp: "1 day ago",
        createdAt: "2026-10-10T09:00:00.000Z",
      },
    ],
  },
  {
    id: "post-6",
    author: "Ana Souza",
    handle: "anasouza",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
    content:
      "Which indicators show that a community is welcoming newcomers effectively?",
    likes: 39,
    dislikes: 2,
    commentFeeSol: 0.005,
    pinataPoolSol: 0,
    createdAt: "3 days ago",
    comments: [
      {
        id: "c-15",
        author: "Samir Dourado",
        handle: "samirdourado",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
        content:
          "Time to first response and how many different people help are good starting points.",
        paidAmountSol: 0.03,
        timestamp: "2 days ago",
        createdAt: "2026-10-09T13:00:00.000Z",
      },
      {
        id: "c-16",
        author: "CryptoDev",
        handle: "cryptodev",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev",
        content:
          "A clear welcome message with straightforward next steps helps a lot.",
        paidAmountSol: 0.02,
        timestamp: "1 day ago",
        createdAt: "2026-10-10T11:00:00.000Z",
      },
    ],
  },
  {
    id: "post-7",
    author: "SolanaFan",
    handle: "solanafan",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SolanaFan",
    content:
      "What feature would make you participate more in a builder community?",
    likes: 32,
    dislikes: 3,
    commentFeeSol: 0.005,
    pinataPoolSol: 0,
    createdAt: "4 days ago",
    comments: [
      {
        id: "c-17",
        author: "ProdutoDAO",
        handle: "produtodao",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ProdutoDAO",
        content:
          "A board for code and product review requests would be very useful.",
        paidAmountSol: 0.01,
        timestamp: "3 days ago",
        createdAt: "2026-10-08T10:00:00.000Z",
      },
      {
        id: "c-18",
        author: "Samir Dourado",
        handle: "samirdourado",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
        content:
          "Finding partners to test ideas also lowers the barrier to entry significantly.",
        paidAmountSol: 0.015,
        timestamp: "2 days ago",
        createdAt: "2026-10-09T14:00:00.000Z",
      },
    ],
  },
  {
    id: "post-8",
    author: "ProdutoDAO",
    handle: "produtodao",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ProdutoDAO",
    content:
      "How do you prioritize user feedback when the team is still small?",
    likes: 32,
    dislikes: 3,
    commentFeeSol: 0.005,
    pinataPoolSol: 0,
    createdAt: "5 days ago",
    comments: [
      {
        id: "c-19",
        author: "Ana Souza",
        handle: "anasouza",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
        content:
          "I group issues by recurring problem and talk with the most affected users before estimating effort.",
        paidAmountSol: 0.02,
        timestamp: "4 days ago",
        createdAt: "2026-10-07T10:00:00.000Z",
      },
      {
        id: "c-20",
        author: "Web3Builder",
        handle: "web3builder",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
        content:
          "A public changelog helps close the loop with the people who sent the suggestion.",
        paidAmountSol: 0.02,
        timestamp: "3 days ago",
        createdAt: "2026-10-08T12:00:00.000Z",
      },
    ],
  },
];

export const PROFILES: iProfile[] = [
  {
    name: "Samir Dourado",
    handle: "samirdourado",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
    bio: "Building healthier communities in the Solana ecosystem.",
    memberSince: "March 2025",
    pinataTargetSol: 1,
  },
  {
    name: "Superteam Brasil",
    handle: "superteambr",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Superteam",
    bio: "Supporting builders and talent throughout the Solana ecosystem in Brazil.",
    memberSince: "January 2025",
    pinataTargetSol: 1,
  },
  {
    name: "CryptoDev",
    handle: "cryptodev",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev",
    bio: "Developer exploring on-chain products and social experiences.",
    memberSince: "April 2025",
    pinataTargetSol: 1,
  },
  {
    name: "Web3Builder",
    handle: "web3builder",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
    bio: "Sharing product and community lessons from the Web3 ecosystem.",
    memberSince: "February 2025",
    pinataTargetSol: 1,
  },
  {
    name: "Ana Souza",
    handle: "anasouza",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
    bio: "Product designer focused on communities and open experiences.",
    memberSince: "May 2025",
    pinataTargetSol: 1,
  },
  {
    name: "SolanaFan",
    handle: "solanafan",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=SolanaFan",
    bio: "Learning, building, and sharing in the Solana ecosystem.",
    memberSince: "June 2025",
    pinataTargetSol: 1,
  },
  {
    name: "ProdutoDAO",
    handle: "produtodao",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ProdutoDAO",
    bio: "Product research, open feedback, and tools for builders.",
    memberSince: "July 2025",
    pinataTargetSol: 1,
  },
];

export const RECENT_WINNERS = [
  {
    name: "Ana Souza",
    handle: "anasouza",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ana",
    prize: "0.42",
  },
  {
    name: "CryptoDev",
    handle: "cryptodev",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=CryptoDev",
    prize: "0.28",
  },
  {
    name: "Web3Builder",
    handle: "web3builder",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Web3Builder",
    prize: "0.19",
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
  anasouza: [],
  solanafan: [],
  produtodao: [],
};