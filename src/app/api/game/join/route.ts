import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { MafiaGame } from '@/lib/mafia-game';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, fid, username, displayName, pfpUrl } = body;

    if (!gameId || !fid || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current game state
    const gameData = await redis.get(`game:${gameId}`);
    if (!gameData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameState = JSON.parse(gameData as string);

    // Recreate game instance
    const game = new MafiaGame(gameState.gameId, gameState.hostFid, '');

    // Restore game state
    Object.assign(game, { game: gameState });

    // Try to add player
    const success = game.addPlayer(fid, username, displayName, pfpUrl);

    if (!success) {
      return NextResponse.json({ error: 'Cannot join game (full or already started)' }, { status: 400 });
    }

    // Update game in Redis
    await redis.setex(`game:${gameId}`, 7200, JSON.stringify(game.getGameState()));

    return NextResponse.json({
      success: true,
      gameState: game.getGameState()
    });

  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
  }
}