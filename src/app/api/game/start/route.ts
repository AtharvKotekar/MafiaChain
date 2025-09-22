import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { MafiaGame } from '@/lib/mafia-game';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, fid } = body;

    if (!gameId || !fid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current game state
    const gameData = await redis.get(`game:${gameId}`);
    if (!gameData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameState = JSON.parse(gameData as string);

    // Check if user is host
    if (gameState.hostFid !== fid) {
      return NextResponse.json({ error: 'Only host can start game' }, { status: 403 });
    }

    // Recreate game instance
    const game = new MafiaGame(gameState.gameId, gameState.hostFid, '');
    Object.assign(game, { game: gameState });

    // Start the game
    const success = game.startGame();
    if (!success) {
      return NextResponse.json({ error: 'Cannot start game (need 9 players)' }, { status: 400 });
    }

    // Update game in Redis
    await redis.setex(`game:${gameId}`, 7200, JSON.stringify(game.getGameState()));

    // Publish game start event for real-time updates
    await redis.publish(`game:${gameId}:events`, JSON.stringify({
      type: 'game_started',
      gameState: game.getGameState()
    }));

    return NextResponse.json({
      success: true,
      gameState: game.getGameState()
    });

  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}