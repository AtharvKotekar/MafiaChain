0 — One-line elevator pitch

MafiaChain — wallet-first multiplayer mafia game with provable role-assignment (commit-reveal / VRF), on-chain escrow for entry fees, in-app private roles & day/night chat, and one-tap social shares to drive votes.

1 — High-level architecture (components & responsibilities)

Frontend (Next.js + Tailwind) — UI, wallet connect (SIWE), ENS display, share UI, show commit hash, show live metrics and leaderboard, generate OG image.

Backend (Node.js + Fastify/Express + Socket.io) — game engine, socket rooms, role assignment, commit-reveal storage, vote tally, admin/dispute endpoints, calls to smart contract finalize.

Redis (Upstash) — ephemeral room state, acks, timers, referral attribution.

Smart contract (Hardhat / Solidity on Base L2) — escrow for ETH deposits; record game commits (optional); finalize payouts (by multisig after dispute window).

Optional Chainlink VRF — provable on-chain randomness for production.

Storage (S3 or IPFS/web3.storage) — OG images / static assets.

Monitoring & logs — Sentry + basic admin dashboard for disputes & audits.

2 — Core features (functional spec)

Wallet auth (SIWE)

Users connect wallet (MetaMask / WalletConnect), sign SIWE nonce. Backend verifies and sets session cookie (or JWT). Display ENS name if present.

Lobby / Room

Create room (host) → roomId. Join room via deep link or QR (/room/<id>?ref=0xabc). Enforce MAX_PLAYERS = 9. Show player list + ENS/avatar.

Entry fee & escrow (real payments)

Players call joinGame(gameId) on contract paying ENTRY = 0.01 ETH. Backend verifies on-chain join events and marks player as paid.

Start & Commit

Host starts the game once 9 joined. Backend generates salt + roles array, computes commit = keccak256(JSON.stringify(roles)+salt). Publish commit in-room (and optionally call contract startGame(gameId, commit)).

Private role delivery & ACKs

Server emits a private socket event roleAssigned to each player with their role. UI shows modal with OK button → agent expects roleAck. Server stores ack timestamps.

Game loop: day / night phases

Day (~5m): group chat (text-only). Anyone can accuse/claim.

Night:

Mafia private chat (2-person text channel or optional WebRTC voice). Mafia vote to kill (server collects mafia vote).

Doctor receives private poll and picks one player to save.

Resolution: server resolves actions; broadcast result message.

Rounds & God role

3 rounds max; if God is killed, server selects a new God randomly from alive players and privately notifies.

Win conditions & payouts

If ≥1 mafia alive after 3 rounds, mafia win; payout split per rules (1 mafia or 2). Else surviving villagers split. Backend computes winners and prepares finalize.

Finalize & dispute window

After game end, begin dispute window (e.g., 24h). If no disputes, multisig owner(s) call finalizeGame(gameId, winners[]) to distribute funds.

Share & virality

After match, show one-tap share to Warpcast/Farcaster or X with prefilled text + OG image. Track clicks & referrals.

Admin & Audit UI

Admin dashboard: game logs, commit/reveal data, reports/disputes, manual payout override if needed.

Metrics & Voting Dashboard

Live counters: unique verified voters, quadratic credits, shares, top referrers. Show to judges.

3 — Data models (canonical JSON)

Player

{
  "address": "0xabc...",
  "displayName": "vitalik.eth",
  "socketId": "s:123",
  "role": null,
  "isAlive": true,
  "ack": false,
  "paid": false,
  "referrer": "0xref"
}


Game

{
  "gameId": "g-0001",
  "players": ["0x..."],
  "state": "waiting|started|day|night|ended",
  "round": 0,
  "roles": ["mafia","mafia","doctor","god","villager",...],
  "commit": "0xdeadbeef",
  "salt": "server-only",
  "startTs": 1680000000,
  "disputeOpen": true,
  "balance": "0.09 ETH",
  "winners": []
}


Action

{
  "actor": "0x..",
  "type": "mafiaVote|doctorSave|vote",
  "target": "0x..",
  "timestamp": 1680000123
}


Referral

{
  "ref": "0xabc",
  "clicks": 12,
  "conversions": 3
}

4 — REST API endpoints (server)

POST /api/nonce → returns nonce; sets httpOnly cookie.

POST /api/siwe/verify → verifies signature, creates session (store in Redis).

POST /api/create-room → create gameId (owner/host).

GET /api/room/:gameId → get public room info + commit.

POST /api/start-game → host starts: triggers commit generation and optionally calls contract startGame.

POST /api/reveal/:gameId → reveal roles + salt (admin/server-only until end).

POST /api/report → player dispute.

POST /api/resolve-dispute → admin resolves.

Blockchain hooks:

POST /api/webhook/contract-event → listens for on-chain Joined events to mark players paid.

Admin:

GET /api/admin/games → list games & statuses.

POST /api/admin/finalize → call finalizeGame via multisig (or prepare multisig txn).

5 — Socket.io event contract (message schema)

Client → Server:

joinRoom {gameId, sessionToken}

sendChat {gameId, text}

ackRole {gameId}

mafiaVote {gameId, targetAddress}

doctorSave {gameId, targetAddress}

castVote {gameId, candidateAddress} // day voting

requestReconnect {gameId} // for reconnect flow

Server → Client:

playerJoined {player}

playerLeft {address}

roleAssigned {role} // private emit to socket

roleAckRequest {}

phaseChange {phase: 'day'|'night'|'ended'}

mafiaPrivateMessage {text} // only to mafia sockets

nightResult {message, killedAddress, saved}

gameEnded {winners: [...], payoutInfo}

commitPublished {commitHash}

revealPublished {roles, salt} // at the end

Socket security: always validate sessionToken on server before accepting socket events. Map socket -> address.

6 — Smart contract design (Solidity) — responsibilities & skeleton

Responsibilities

Accept ETH deposits per player.

Record per-game balance.

Optionally store commit (start signature) immutably.

Expose finalizeGame(gameId, winners[]) to multisig owner (or to contract if fully trustless).

Emit events for Joined, Started(commit), Finalized.

Important requirements

finalizeGame should be protected by:

onlyOwner or multisig (Gnosis Safe).

require(block.timestamp >= games[gameId].startTs + disputeWindow).

Track per-game balances not global address(this).balance.

Skeleton (excerpt)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MafiaEscrow is ReentrancyGuard, Ownable {
    uint public constant ENTRY = 0.01 ether;
    uint public constant MAX_PLAYERS = 9;
    uint public disputeWindow = 24 hours;

    struct Game {
      address[] players;
      mapping(address => bool) isPlayer;
      uint balance;
      bool started;
      uint256 commit;
      uint startTs;
      bool finalized;
    }
    mapping(uint => Game) private games;
    uint public gameCount;

    event Joined(uint gameId, address player);
    event Started(uint gameId, uint256 commit);
    event Finalized(uint gameId, address[] winners);

    function createGame() external returns(uint) {
      gameCount++; 
      return gameCount;
    }

    function joinGame(uint gameId) external payable nonReentrant {
      require(msg.value == ENTRY, "wrong fee");
      Game storage g = games[gameId];
      require(!g.started, "already started");
      require(g.players.length < MAX_PLAYERS, "full");
      require(!g.isPlayer[msg.sender], "already joined");

      g.players.push(msg.sender);
      g.isPlayer[msg.sender] = true;
      g.balance += msg.value;
      emit Joined(gameId, msg.sender);
    }

    function startGame(uint gameId, uint256 commit) external onlyOwner {
      Game storage g = games[gameId];
      require(!g.started, "started");
      require(g.players.length == MAX_PLAYERS, "need players");
      g.started = true;
      g.commit = commit;
      g.startTs = block.timestamp;
      emit Started(gameId, commit);
    }

    function finalizeGame(uint gameId, address[] calldata winners) external nonReentrant onlyOwner {
      Game storage g = games[gameId];
      require(g.started && !g.finalized, "bad state");
      require(block.timestamp >= g.startTs + disputeWindow, "dispute window");
      uint share = g.balance / winners.length;
      for (uint i=0; i<winners.length; i++) {
        payable(winners[i]).transfer(share);
      }
      g.finalized = true;
      emit Finalized(gameId, winners);
    }

    // add emergency withdraw, refund logic, etc.
}


Testing: write unit tests for join/start/finalize and edge-case (player double-join, partial payments). Use Hardhat + ethers for deployment and tests.

7 — RNG & fairness (how to implement)

Option A — Chainlink VRF (recommended production)

Integrate VRF to get a verifiable random seed on-chain. Use VRF to determine a random permutation for roles. Implementation: call VRF to request randomness; when VRF callback delivers randomness, shuffle roles deterministically with that seed.

Option B — Commit-reveal (fast hackathon)

Server generates salt + roles -> commit = keccak256(JSON.stringify(roles)+salt).

Publish commit to room and optionally on-chain via startGame(gameId, commit). Keep salt server-side until reveal. After game ends reveal roles + salt. Anyone can check keccak256(JSON.stringify(roles)+salt) == commit.

Why commit-reveal? fast, low-cost, gives verifiability without VRF integration.

8 — SIWE implementation steps (detailed)

Client: connect wallet (wagmi + connectors).

Client calls GET /api/nonce → server returns nonce and sets short-lived httpOnly cookie.

Client signs message:

"Sign in to MafiaChain\n\nNonce: <nonce>\nIssued At: <timestamp>"


Client POST /api/siwe/verify {address, message, signature}. Server validates ethers.utils.verifyMessage(message, signature) === address and that message contains server nonce. Server stores session token in Redis and sets a secure session cookie.

Session token: store sessionId -> address mapping in Redis with expiry. Attach to socket auth header so server validates socket membership.

9 — UI structure & pages (what to build)

/ Landing — explanation, “create room” button, demo GIF, rules, legal notice.

/create Create room flow (host enters room name).

/room/[id] Lobby (player list, join, entry status, refer link, start button for host).

/game/[id] In-game UI:

Top: commit hash & round counters.

Left: chat box (day), mafia private stream (night).

Center: main feed with system announcements.

Right: player list with ENS / avatars / status / referrer badges.

Bottom: action bar for doctor polls, voting UI.

/admin Admin dashboard (audit logs, dispute resolution).

Share modal component (prefill share text + OG image).

10 — Quadratic voting & UI calculation

Each voter has N credits (e.g., default 100). If they allocate v votes to a project, cost = v^2 credits.

UI: slider or +/− buttons that show cost = v*v and remaining credits; call backend to submit voteAmount and deduct credits from the voter's account stored by the voting platform (not your app). If hackathon exposes an API, integrate accordingly. For internal demo, simulate QV client-side and show visual.

Example calculation snippet

function costForVotes(votes) { return votes * votes; }


Make sure to show the quadratic budget visually.

11 — Acceptance tests & QA checklist

Automated tests

Smart contract unit tests:

joinGame adds players and increases balance.

startGame sets commit and startTs.

finalizeGame only works after disputeWindow and correctly splits funds.

Backend integration:

SIWE nonce & verify flow works end-to-end.

Socket: joinRoom emits playerJoined; roleAssigned private.

Commit-reveal recomputed equals published commit after reveal.

Manual tests

Full game with 9 wallets on testnet: join → start → roles delivered → play 3 rounds → reveal → finalize (after test window shortened) → payouts occur.

Stress test socket disconnect/reconnect flows.

Try cheating scenarios: server role change after publish (should be caught by commit mismatch), double-join attempts.

Acceptance criteria

9 players can join and pay on testnet.

Roles are assigned privately and a commit hash published.

Game flows without crashes for 3 rounds.

Finalize distributes ETH correctly after dispute window.

Share modal works and OG images render correctly.

12 — Dev environment & quick commands (setup)

Initialize repo

npx create-next-app farcaster-mafia
cd farcaster-mafia
npm init -y
npm i express fastify socket.io socket.io-client redis upstash ethers wagmi @rainbow-me/rainbowkit tailwindcss hardhat @openzeppelin/contracts web3.storage siwe
npx hardhat


Hardhat quick deploy script (local)

Create hardhat.config.js with Base testnet RPC, set private key via env.

Dev run

Start backend server: node server/index.js or via nodemon.

Start frontend: npm run dev.

13 — Deployment plan (production-ready)

Frontend: Vercel (automatic deploys).

Backend: Railway / Render / Fly or Docker container on cloud VM.

Redis: Upstash (serverless Redis).

Contract: Hardhat deploy to Base mainnet using Gnosis Safe as owner.

Multisig & timelock: deploy Gnosis Safe and configure signers.

Monitoring: Sentry + dashboards, set alerts on errors and failed payouts.

14 — Security, legal & operational guardrails (must-do before real money)

Non-negotiable before accepting live ETH:

Legal counsel: local laws on online gaming / gambling. Do not skip.

KYC / Age check: integrate a KYC provider (Persona, Sumsub, Onfido) and block banned jurisdictions.

Multisig & timelock: multisig owner for finalizeGame, plus a timelock for finalization (e.g., 24-72h).

Contract audit: third-party audit for contract & backend payout logic.

AML monitoring: basic rules & flagging.

Terms & TOS: visible T&Cs, dispute resolution, contact support.

Emergency refund path: admin refund function to return funds if game compromised.

Be explicit to users that you are handling real funds and state the dispute window.

15 — Distribution playbook for quadratic voting (specific steps to get votes)

Target heavy voters: create a VIP list (judges, mentors, influential builders). One personal ask to 10 people > 100 public posts.

One-tap vote deep-link: make voting link open vote with minimal steps. Test it and have a fallback screenshot guide.

Scarcity & badges: mint limited winner/referrer NFT badges and offer them to top referrers.

Referral leaderboard: track ?ref= and show live leaderboard. Reward top 3 publicly.

Personal DM templates (use short copy). Provide demo GIF & ask for 5-10 credits.

In-person QR distribution: print cards with QR → link to one-click vote + join.

Leverage social proof: request mentors to publish small casts with GIFs. Show these during demo.

Final push: last 30 min targeted asks to heavy voters.

16 — Prioritized sprint plan (for AI agent to execute)

Sprint 0 — Setup (1–2h)

Create repo, configure Hardhat, add env secrets, provision Redis Upstash dev instance.

Sprint 1 — Auth & Socket (3–5h)

Implement SIWE endpoints (/api/nonce, /api/verify), session store in Redis.

Implement basic Socket.io server: joinRoom, sendChat, private emits.

Basic UI to connect wallet & join room.

Sprint 2 — Lobby + Payment Hook (3–5h)

Implement createRoom, joinRoom UI, show payment required.

Deploy contract to Base testnet minimal escrow, test joinGame deposit flow and webhook to server.

Sprint 3 — Role assignment + commit (2–4h)

Server commit creation, private role emits, ACKs, show commit on UI.

Sprint 4 — Game loop (4–6h)

Implement day/night, mafia private channel (text), doctor poll, resolution messages, round progression.

Sprint 5 — Reveal, Finalize & Admin (3–6h)

Implement reveal endpoint, admin finalize workflow (prepare multisig transaction), admin dashboard for disputes.

Sprint 6 — Share + OG + Metrics (2–4h)

Share modal, OG image generation, referral tracking, leaderboard.

Sprint 7 — Testing & polish (4–8h)

Run end-to-end test on Base testnet, fix bugs, run unit tests.

Sprint 8 — Audit / KYC / Production prep (variable)

Integrate KYC provider, legal checklist, conduct smart-contract audit, configure multisig.

17 — Acceptance tasks for the AI agent (explicit step-by-step instructions)

(These are tasks you can give an AI code agent to execute one-by-one.)

Init repo & skeleton: create Next.js + server folder + hardhat scaffold + .env.example.

Implement SIWE:

Add /api/nonce and /api/siwe/verify.

Redis session store.

Wallet connect UI using wagmi + RainbowKit.

Socket server:

Create server/socket.js with authentication middleware (validate session token).

Implement joinRoom + playerJoined + sendChat.

Hardhat contract:

Add contracts/MafiaEscrow.sol skeleton, compile/test, deploy script for Base testnet.

Webhook & payment handling:

Add /api/webhook/contract-event to confirm on-chain join events.

Mark player as paid in Redis when event seen.

Create/start room flow:

UI for host to create room and startGame call that generates commit, stores roles & salt in server.

Role assignment:

Server assignRoles() picks roles, saves roles & salt encrypted in DB, publishes commit.

Emit private roleAssigned events.

ACK flow:

Client shows role modal, clicks OK → mutates ackRole, server stores ack timestamps.

Game loop:

Implement phase transitions, mafia private channel, doctor poll, resolution logic, and public announcements.

Reveal:

Implement reveal endpoint to expose roles & salt after game end and validate against commit.

Finalize:

Admin prepare multisig finalize transaction (Gnosis Safe).

Share:

Share modal with Warpcast / X deep links; OG image generation via node-canvas.

Metrics & leaderboard:

Track referrals & clicks, implement simple dashboard.

Test & deploy:

Run full-e2e on Base testnet, fix bugs, deploy frontend & backend.

For each task, the agent should:

Create a branch: feat/<task-name>.

Add tests (unit where applicable).

Open PR and include a short changelog & test results.

Deploy to staging automatically (Vercel & Railway) upon merge to staging.

18 — Example small code snippets (copy/paste)

Commit calculation (Node)

const { keccak256, toUtf8Bytes } = require('ethers').utils;

function computeCommit(rolesArray, salt) {
  const payload = JSON.stringify(rolesArray);
  return keccak256(toUtf8Bytes(payload + salt));
}


SIWE verify (server lightweight)

import { ethers } from 'ethers';
app.post('/api/siwe/verify', async (req, res) => {
  const { address, message, signature } = req.body;
  const signer = ethers.utils.verifyMessage(message, signature);
  if (signer.toLowerCase() !== address.toLowerCase()) return res.status(401).send('invalid');
  const sessionId = crypto.randomBytes(16).toString('hex');
  await redis.set(`session:${sessionId}`, address, 'EX', 3600 * 24);
  res.cookie('session', sessionId, { httpOnly: true, secure: true });
  return res.json({ ok: true });
});


Socket auth middleware

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.sessionToken;
  if (!token) return next(new Error("no auth"));
  const address = await redis.get(`session:${token}`);
  if (!address) return next(new Error("invalid session"));
  socket.address = address;
  next();
});

19 — Final checklist (before handing to real users)

Legal counsel sign-off for jurisdictions.

KYC integrated & tested.

Smart contract audited.

Multisig & timelock configured.

Admin dispute UI built.

Robust logging & monitoring active.

Communication channels ready (support email + in-app support).

20 — Closing, blunt notes to you

If you run real ETH games without KYC, multisig, or legal advice you are asking for trouble. Don’t be cavalier. Start with testnet to prove the tech and traction; once you have users & traction, do the legal & audit steps before mainnet money.

Distribution wins the contest: build one-tap share, referral leaderboards, and personally ask heavy voters. Technical polish won’t beat a targeted distribution plan.

If you want, I’ll now generate the exact starter repo (Next.js + SIWE + Socket.io + Hardhat contract skeleton + README + Dockerfile) ready to copy/paste. Say “scaffold repo” and I’ll dump files right now.