import { NextRequest, NextResponse } from 'next/server';
import { createGameFrame, parseFrameAction, createErrorFrame } from '@/lib/frame-utils';
import { GameEngine } from '@/lib/game-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = parseFrameAction(body);
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return new NextResponse(createErrorFrame('Game ID is required.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const playerFid = action.fid;

    try {
      const game = await GameEngine.getGame(gameId);
      if (!game) {
        return new NextResponse(createErrorFrame('Game not found.'), {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Check if player is the host
      if (game.host !== playerFid) {
        return new NextResponse(createErrorFrame('Only the host can start the game.'), {
          status: 403,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Check if game has enough players
      if (game.playerOrder.length !== 9) {
        return new NextResponse(createErrorFrame('Need exactly 9 players to start.'), {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      if (game.phase !== 'lobby') {
        return new NextResponse(createErrorFrame('Game has already started.'), {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Start the game
      const success = await GameEngine.startGame(gameId);
      if (!success) {
        return new NextResponse(createErrorFrame('Failed to start game. Please try again.'), {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Get updated game state
      const updatedGame = await GameEngine.getGame(gameId);
      const userRole = updatedGame?.players[playerFid]?.role;

      // Return game frame
      return new NextResponse(createGameFrame(gameId, 'starting', 1, userRole), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });

    } catch (error) {
      console.error('Error starting game:', error);
      return new NextResponse(createErrorFrame('Failed to start game. Please try again.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }

  } catch (error) {
    console.error('Error in start frame:', error);
    return new NextResponse(createErrorFrame('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}