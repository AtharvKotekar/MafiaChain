# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MafiaChain is a multiplayer Mafia game with ETH prizes, built as a Farcaster Frame on Base L2. The game supports exactly 9 players per game with 0.001 ETH entry fees on testnet.

## Development Commands

### Next.js Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Smart Contract Development (Hardhat)
- `npm run hardhat:compile` - Compile smart contracts
- `npm run hardhat:test` - Run contract tests
- `npm run hardhat:deploy` - Deploy to Base Sepolia testnet
- `npm run hardhat:deploy-local` - Deploy to local Hardhat network
- `npm run hardhat:address` - Get deployed contract address on Base Sepolia

## Architecture

### Smart Contract (`src/contracts/SimpleMafiaEscrow.sol`)
- Entry fee: 0.001 ETH (testnet)
- Max players: 9
- Dispute window: 1 hour (shortened for testing)
- Owner-controlled game lifecycle (create, start, finalize)
- Emergency refund capability

### Backend (Next.js API Routes)
- Frame endpoints: `/api/frame/*` - Handle Farcaster Frame interactions
- Image generation: `/api/og` - Dynamic OG image generation with @vercel/og
- Cron jobs: `/api/cron` - Timer-based game management (runs every 5 minutes via Vercel)

### Core Libraries (`src/lib/`)
- `game-engine.ts` - Game logic and state management
- `redis.ts` - Redis state management (Upstash)
- `frame-utils.ts` - Farcaster Frame utilities
- `types.ts` - TypeScript type definitions

### Configuration
- **Network**: Base Sepolia (testnet) and Base Mainnet
- **Solidity**: Version 0.8.20 with optimizer enabled
- **RPC**: Base network endpoints via environment variables
- **Contract verification**: Basescan API integration

## Environment Setup

Required environment variables (see `.env.local.example`):
- `NEYNAR_API_KEY` - Farcaster API access
- `UPSTASH_REDIS_URL` & `UPSTASH_REDIS_TOKEN` - Redis state storage
- `BASE_RPC_URL` - Base Sepolia RPC endpoint
- `BASE_MAINNET_RPC_URL` - Base Mainnet RPC endpoint
- `PRIVY_APP_ID` & `PRIVY_APP_SECRET` - Embedded wallet provider
- `PRIVATE_KEY` - Deployer wallet private key
- `BASESCAN_API_KEY` - Contract verification

## Game Flow

1. **Create/Join**: Host creates game, players join via Farcaster Frame
2. **Payment**: Players pay 0.001 ETH entry fee through embedded wallets
3. **Start**: Game starts when 9 players have joined and paid
4. **Roles**: 2 Mafia, 1 Doctor, 1 God, 5 Villagers (assigned via private DMs)
5. **Gameplay**: 3 rounds max with day/night phases
6. **Finalization**: Winners determined, contract distributes ETH after dispute window

## Key Technical Notes

- **Testnet Only**: Built for Base Sepolia with small entry fees - not production ready
- **Frame-based**: Entirely runs within Farcaster Frames (no separate app needed)
- **Redis State**: Game state stored in Upstash Redis for real-time updates
- **Hardhat Paths**: Sources in `./src/contracts`, artifacts in `./artifacts`
- **Vercel Deployment**: Configured with cron jobs and Node.js runtime for API routes