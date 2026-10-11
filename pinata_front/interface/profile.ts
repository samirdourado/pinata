export interface iProfile {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  memberSince: string;
  pinataBalanceSol: number;
  pinataTargetSol: number;
}

export interface iProfileWinner {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  prizeSol: number;
  createdAt: string;
}