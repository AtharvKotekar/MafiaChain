import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { MafiaGame } from '@/lib/mafia-game';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, username, displayName } = body;

    if (!fid || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique game ID
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new game instance
    const game = new MafiaGame(gameId, fid, username);

    // Store game in Redis with 2 hour expiration
    await redis.setex(`game:${gameId}`, 7200, JSON.stringify(game.getGameState()));

    // Store game in active games list
    await redis.sadd('active_games', gameId);

    return NextResponse.json({
      success: true,
      gameId,
      gameState: game.getGameState()
    });

  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}