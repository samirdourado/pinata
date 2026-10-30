//! Winner selection from the VRF output.
//!
//! The 32 random bytes seed a small deterministic generator (SplitMix64), so
//! anyone can recompute the draw from the on-chain randomness and tickets.
//! Every ticket has the same chance; a wallet with more tickets (more comments)
//! has more chances, but can win only once per draw.

use anchor_lang::prelude::*;

use crate::constants::{DRAW_ATTEMPTS_PER_WINNER, TICKET_SIZE};

struct SplitMix64(u64);

impl SplitMix64 {
    fn from_randomness(randomness: &[u8; 32]) -> Self {
        let mut seed = 0u64;
        for (i, chunk) in randomness.chunks_exact(8).enumerate() {
            let word = u64::from_le_bytes(chunk.try_into().unwrap());
            seed ^= word.rotate_left(16 * i as u32);
        }
        Self(seed)
    }

    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
}

fn ticket(tickets: &[u8], index: usize) -> Pubkey {
    let start = index * TICKET_SIZE;
    Pubkey::try_from(&tickets[start..start + TICKET_SIZE]).unwrap()
}

/// Picks up to `max_winners` distinct wallets from `tickets` (32 bytes each).
/// Returns fewer when there are fewer distinct wallets.
pub fn pick_winners(tickets: &[u8], max_winners: usize, randomness: &[u8; 32]) -> Vec<Pubkey> {
    let count = tickets.len() / TICKET_SIZE;
    let mut rng = SplitMix64::from_randomness(randomness);
    let mut winners: Vec<Pubkey> = Vec::with_capacity(max_winners);

    while winners.len() < max_winners && count > 0 {
        let mut found = None;
        let mut index = 0;
        // Random picks keep every ticket equally likely.
        for _ in 0..DRAW_ATTEMPTS_PER_WINNER {
            index = (rng.next() % count as u64) as usize;
            let candidate = ticket(tickets, index);
            if !winners.contains(&candidate) {
                found = Some(candidate);
                break;
            }
        }
        // Repeated hits on wallets that already won: scan from the last pick so a
        // remaining distinct wallet is always found when one exists.
        if found.is_none() {
            found = (1..count)
                .map(|step| ticket(tickets, (index + step) % count))
                .find(|candidate| !winners.contains(candidate));
        }
        match found {
            Some(winner) => winners.push(winner),
            None => break,
        }
    }
    winners
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tickets_of(wallets: &[Pubkey]) -> Vec<u8> {
        wallets.iter().flat_map(|w| w.to_bytes()).collect()
    }

    #[test]
    fn no_tickets_no_winners() {
        assert!(pick_winners(&[], 3, &[7; 32]).is_empty());
    }

    #[test]
    fn single_wallet_wins_alone_even_with_many_tickets() {
        let alice = Pubkey::new_unique();
        let tickets = tickets_of(&[alice, alice, alice]);
        assert_eq!(pick_winners(&tickets, 3, &[1; 32]), vec![alice]);
    }

    #[test]
    fn winners_are_distinct_and_capped() {
        let wallets: Vec<Pubkey> = (0..10).map(|_| Pubkey::new_unique()).collect();
        let mut tickets = tickets_of(&wallets);
        tickets.extend(tickets_of(&wallets)); // two tickets each
        for seed in 0..50u8 {
            let winners = pick_winners(&tickets, 3, &[seed; 32]);
            assert_eq!(winners.len(), 3);
            assert!(winners[0] != winners[1] && winners[1] != winners[2] && winners[0] != winners[2]);
        }
    }

    #[test]
    fn finds_rare_wallet_among_duplicates() {
        // 2 distinct wallets, one with 500 tickets and one with a single ticket
        let whale = Pubkey::new_unique();
        let minnow = Pubkey::new_unique();
        let mut wallets = vec![whale; 500];
        wallets.push(minnow);
        let winners = pick_winners(&tickets_of(&wallets), 3, &[9; 32]);
        assert_eq!(winners.len(), 2);
        assert!(winners.contains(&whale) && winners.contains(&minnow));
    }

    #[test]
    fn same_randomness_same_result() {
        let wallets: Vec<Pubkey> = (0..20).map(|_| Pubkey::new_unique()).collect();
        let tickets = tickets_of(&wallets);
        assert_eq!(pick_winners(&tickets, 3, &[42; 32]), pick_winners(&tickets, 3, &[42; 32]));
    }

    #[test]
    fn more_tickets_win_more_often() {
        let heavy = Pubkey::new_unique();
        let light = Pubkey::new_unique();
        let mut wallets = vec![heavy; 9];
        wallets.push(light);
        let tickets = tickets_of(&wallets);
        let heavy_wins = (0..=255u8)
            .filter(|seed| pick_winners(&tickets, 1, &[*seed; 32])[0] == heavy)
            .count();
        // Expected ~90% of 256; allow sampling noise
        assert!(heavy_wins > 200, "heavy won {heavy_wins} of 256");
    }
}
