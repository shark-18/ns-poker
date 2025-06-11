# NS Poker App

A decentralized poker table management application supporting both EVM and Solana chains.

## Features

- Create poker tables with fixed buy-ins
- Support for ETH, USDC, SOL, and USDC-SOL tokens
- Real-time seat management
- Multi-chain wallet support (EVM + Solana)
- Telegram bot integration for wallet linking and leaderboard
- Automated escrow management

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- EVM: wagmi v2 + viem + RainbowKit
- Solana: @solana/wallet-adapter
- Supabase (Database + Realtime)
- Socket.io
- Smart Contracts:
  - EVM: Solidity (OpenZeppelin Escrow)
  - Solana: Anchor

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

4. Run tests:
```bash
npm run test
```

5. Start the Telegram bot:
```bash
npm run bot
```

## Development

- `npm run dev` - Start Next.js development server
- `npm run test` - Run Foundry tests
- `npm run deploy` - Deploy contracts
- `npm run bot` - Start Telegram bot

## Environment Variables

Required environment variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# EVM
NEXT_PUBLIC_ALCHEMY_API_KEY=
NEXT_PUBLIC_INFURA_API_KEY=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=

# Solana
NEXT_PUBLIC_HELIUS_API_KEY=
NEXT_PUBLIC_SOLANA_RPC_URL=

# Telegram Bot
TELEGRAM_BOT_TOKEN=

# Contract Deployment
PRIVATE_KEY=
SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=
```

## License

MIT

## Demo
[Live Deployed App](https://nextjs-tailwind-rainbowkit-starter-rouge.vercel.app/)

## How to use

Coming soon

<!-- Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init) or [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) to bootstrap the example:

```bash
npx create-rainbowkit-app --example with-tailwindcss with-tailwindcss-app
# or
yarn create next-app --example with-tailwindcss with-tailwindcss-app
# or
pnpm create next-app -- --example with-tailwindcss with-tailwindcss-app
``` -->

Deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=next-example) ([Documentation](https://nextjs.org/docs/deployment)).
