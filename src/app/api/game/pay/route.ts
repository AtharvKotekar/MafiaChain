import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
// import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
// import { base, baseSepolia } from 'viem/chains';
// import { privateKeyToAccount } from 'viem/accounts';

const ENTRY_FEE = '0.001'; // ETH
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, fid, walletAddress } = body;

    if (!gameId || !fid || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json({ error: 'Contract not deployed' }, { status: 500 });
    }

    // Get game state
    const gameData = await redis.get(`game:${gameId}`);
    if (!gameData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameState = JSON.parse(gameData as string);

    // Check if player is in game
    const player = gameState.players.find((p: { fid: number }) => p.fid === fid);
    if (!player) {
      return NextResponse.json({ error: 'Player not in game' }, { status: 400 });
    }

    // Check if already paid
    if (player.paid) {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    // For now, simulate payment success
    // In production, you would verify the actual blockchain transaction

    // Mark player as paid
    const playerIndex = gameState.players.findIndex((p: { fid: number }) => p.fid === fid);
    gameState.players[playerIndex].paid = true;
    gameState.players[playerIndex].walletAddress = walletAddress;

    // Update game state
    await redis.setex(`game:${gameId}`, 7200, JSON.stringify(gameState));

    // Publish payment event
    await redis.publish(`game:${gameId}:events`, JSON.stringify({
      type: 'payment_received',
      fid,
      walletAddress,
      gameState
    }));

    return NextResponse.json({
      success: true,
      entryFee: ENTRY_FEE,
      contractAddress: CONTRACT_ADDRESS,
      gameState
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}