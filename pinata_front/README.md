# Pinata Frontend

This is the front-end prototype for Pinata, a Web3 social platform that monetizes quality discussion with low-cost comment participation. It is built with Next.js, React, TypeScript, and Tailwind CSS.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Local mock data state management

## Features

- Email or username sign-in and account registration
- Local account sessions with a dashboard for saved account details
- Password validation from 6 to 12 characters
- Home feed and trending content
- Paid-comment interactions
- Vote-driven ranking
- User and public profile views
- Piñata Pool progress and countdown
- Responsive social UI prototype

## Account routes

- `/register`: create an account with display name, username, email, and password; bio is optional
- `/login`: sign in with email or username and password
- `/dashboard`: view the signed-in account details and activity
- `/me`: open the signed-in user's social profile

Account records and the current session are stored in the browser's `localStorage`. Passwords are stored as salted PBKDF2 hashes. This is a frontend prototype only: browser storage can be modified by the user, so this flow is not server-side authentication and must not be used to protect production data or authorize real payments. Mock profiles and posts remain available for demo purposes.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Production build

```bash
npm run build
```

## Notes

The app is designed as a concept demo and uses mock data to simulate the protocol behavior, social ranking, and prize distribution experience.
