# 🎭 MafiaChain - Farcaster Frame

Multiplayer Mafia game with ETH prizes, built as a Farcaster Frame on Base L2.

## 🎮 Game Overview

- **9 Players**: Exactly 9 players per game
- **Entry Fee**: 0.001 ETH (testnet)
- **Roles**: 2 Mafia, 1 Doctor, 1 God, 5 Villagers
- **Duration**: 3 rounds max, ~15 minutes
- **Platform**: Farcaster Frames (no app needed!)

## 🏗️ Architecture

- **Frontend**: Next.js + Farcaster Frames
- **Backend**: Next.js API routes + Redis state
- **Blockchain**: Base Sepolia testnet
- **Wallet**: Privy embedded wallets
- **Images**: @vercel/og dynamic generation

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd mafiachain-frame
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Fill in your API keys:
# - NEYNAR_API_KEY (Farcaster)
# - UPSTASH_REDIS_URL & TOKEN (Redis)
# - ALCHEMY_BASE_KEY (Base network)
# - PRIVY_APP_ID & SECRET (Wallets)
# - PRIVATE_KEY (Deployer wallet)
```

### 3. Deploy Smart Contract

```bash
# Compile contract
npm run hardhat:compile

# Deploy to Base Sepolia
npm run hardhat:deploy

# Update .env.local with contract address
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Test Your Frame

- Use [Frame Ground](https://frameground.app) to test locally
- Share frame URL in Warpcast to test live

## 📁 Project Structure

```
src/
├── app/api/
│   ├── frame/           # Frame endpoints
│   ├── og/              # Image generation
│   └── cron/            # Timer jobs
├── lib/
│   ├── game-engine.ts   # Game logic
│   ├── redis.ts         # State management
│   ├── frame-utils.ts   # Frame helpers
│   └── types.ts         # TypeScript types
├── contracts/
│   └── SimpleMafiaEscrow.sol
└── scripts/
    └── deploy.ts
```

## 🎯 Game Flow

1. **Create/Join**: Host creates game, players join via frame
2. **Payment**: Players pay 0.001 ETH entry fee (embedded wallet)
3. **Start**: Game starts when 9 players joined
4. **Roles**: Secret roles assigned via private DMs
5. **Day Phase**: 5min discussion, vote to eliminate
6. **Night Phase**: Mafia kills, Doctor saves
7. **Win**: Mafia wins if they equal villagers, else villagers win

## 🔧 API Endpoints

### Frame Routes
- `GET/POST /api/frame` - Main landing
- `POST /api/frame/create` - Create game
- `POST /api/frame/join` - Join game
- `POST /api/frame/lobby` - Lobby state
- `POST /api/frame/start` - Start game
- `POST /api/frame/game` - Game state

### Image Generation
- `GET /api/og?type=landing` - Landing image
- `GET /api/og?type=lobby&gameId=X&playerCount=5` - Lobby
- `GET /api/og?type=game&phase=day&round=1&userRole=mafia` - Game

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run typecheck       # TypeScript check

# Smart Contracts
npm run hardhat:compile # Compile contracts
npm run hardhat:test    # Run tests
npm run hardhat:deploy  # Deploy to testnet
```

## 🚨 Important Notes

### Testnet Only
This is built for Base Sepolia testnet with 0.001 ETH entry fees. **DO NOT** use on mainnet without proper audits and legal review.

### Legal Compliance
Online gaming with real money requires legal compliance in many jurisdictions. Consult legal counsel before accepting real ETH.

---

**Built with ❤️ for the Farcaster community**

*Ready to play? Share the frame in Warpcast and let the games begin! 🎭*
