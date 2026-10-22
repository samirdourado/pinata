# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Pinata is a hackathon prototype of a Solana SocialFi app: posting is free, comments carry a small SOL fee, and 40% of each fee fills the post author's "Creator Piñata" prize pool. **Solana is entirely simulated.** There is no backend, no wallet and no on-chain code. All state lives in the browser's `localStorage`. The READMEs are bilingual (English and pt-BR); keep both language sections in sync when you edit them.

- `pinata_front/`: the Next.js app (everything that runs)
- `videos/`: Python tooling that drives the running app with Playwright and renders the pitch and demo MP4s

## Commands

Run from `pinata_front/`:

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint     # ESLint (flat config, eslint-config-next)
```

There is no test suite. To check behaviour, run the app and follow the two-account flow in `pinata_front/README.md` ("Try the full flow").

Video pipeline (Python 3.11, repo `.venv`). The app must be running (`npm run build && npm run start`):

```bash
python -m pip install -r videos/requirements-video.txt
python videos/capture_app.py --url http://localhost:3000   # screenshots -> videos/rendered/
python videos/generate_demo_videos.py [pitch|demo] [--srt-only]
```

## Next.js version caveat

`pinata_front/AGENTS.md` (managed by `next dev`): this is Next.js 16.4 / React 19.3, and its APIs may differ from what you know. Before writing Next-specific code, read the relevant guide in `pinata_front/node_modules/next/dist/docs/`. Typed route helpers such as `LayoutProps<"/">` are in use. `next dev` re-adds the AGENTS.md blocks if you remove them, so leave that file alone.

## Architecture

**Two client-side stores in `utils/`, each a plain module-level singleton (not React state):**

- `authStore.ts`: accounts (`pinata-auth-users-v1`) and the session id (`pinata-auth-session-v1`). Zod schemas define the validation rules for forms and stored data. Passwords are hashed with PBKDF2 through Web Crypto. Each change fires a custom `pinata-auth-change` window event.
- `socialStore.ts`: posts, comments, votes, profiles and Piñata winners, stored as a single blob (`pinata-social-state-v2`). Every mutation goes through `publish()`, which replaces `state`, writes to localStorage and notifies listeners. A `storage` event listener keeps tabs in sync. If you change the shape of `SocialState`, update `parseStoredState` too, and consider bumping the key version.

**React bindings (`components/`):**

- `SocialProvider` is a pass-through wrapper. The real hook is `useSocial()`, which uses `useSyncExternalStore(subscribeSocial, getSocialSnapshot, getInitialSocialSnapshot)` and returns the state plus the store's mutation functions. The server snapshot is the mock seed data, so a hydration mismatch happens whenever local state differs from the seed.
- `AuthProvider` (React context, `useAuth()`) connects the two stores: on load, login or register it calls `upsertProfile(authUserToProfile(user))` so that each account has a social profile. When a username changes, `updateSocialProfile` rewrites the handle, name and avatar on every post, comment and winner record.

**Domain math (`utils/pinata.ts`):** `PINATA_COMMENT_SHARE = 0.4` and `MIN_COMMENT_SOL = 0.005`. A profile's Piñata balance is computed from comments on that creator's posts since `profile.pinataStartedAt`; it is never stored. `popProfilePinata` (in socialStore) requires the balance to reach 60% of `pinataTargetSol`, then picks a random commenter other than the owner, records the winner (the latest 5 are kept) and resets the round by setting `pinataStartedAt`. No SOL is moved.

**Seed data:** `data/mockData.ts` provides the demo profiles, posts and winners. Demo profile handles are reserved and cannot be registered. `CURRENT_USER_HANDLE` is the author fallback when no one is signed in. The simulated wallet (fixed address and balance) is hardcoded in `components/Navbar`.

**Conventions:** each component lives in `components/<Name>/index.tsx`; models are `interface/*.ts` with an `i` prefix (`iPost`, `iComment`, `iProfile`); imports use the `@/` alias, which maps to `pinata_front/`. Styling is Tailwind v4, with theme tokens in `app/globals.css`.

## Coupling with the video scripts

`videos/capture_app.py` drives the UI through accessible names and labels, for example the buttons "Create account", "Connect Wallet", "Sign out" and "Open post by…", the "New comment" label, and `role=dialog`. Renaming any of these breaks the video capture. Narration and scene text are generated from `videos/video_content.py`; the `.srt` and script files are outputs of it.
