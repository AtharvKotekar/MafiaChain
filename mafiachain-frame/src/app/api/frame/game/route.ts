import { NextRequest, NextResponse } from 'next/server';
import { createGameFrame, parseFrameAction, createErrorFrame } from '@/lib/frame-utils';
import { GameEngine } from '@/lib/game-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return new NextResponse(createErrorFrame('Game ID is required.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const game = await GameEngine.getGame(gameId);
    if (!game) {
      return new NextResponse(createErrorFrame('Game not found.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // For GET requests, we don't know the user, so show generic game frame
    return new NextResponse(createGameFrame(gameId, game.phase, game.round), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in game GET:', error);
    return new NextResponse(createErrorFrame('Failed to load game. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

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

      // Check if player is in the game
      if (!game.players[playerFid]) {
        return new NextResponse(createErrorFrame('You are not in this game.'), {
          status: 403,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      const userRole = game.players[playerFid]?.role;

      // Handle different button actions based on current phase
      switch (action.buttonIndex) {
        case 1:
          // First button - varies by phase
          if (game.phase === 'day') {
            // Chat button - redirect to chat
            return NextResponse.redirect(new URL(`/api/frame/chat?gameId=${gameId}`, req.url));
          } else if (game.phase === 'night' && userRole === 'mafia') {
            // Kill button - redirect to kill selection
            return NextResponse.redirect(new URL(`/api/frame/kill?gameId=${gameId}`, req.url));
          } else if (game.phase === 'night' && userRole === 'doctor') {
            // Save button - redirect to save selection
            return NextResponse.redirect(new URL(`/api/frame/save?gameId=${gameId}`, req.url));
          } else if (game.phase === 'ended') {
            // Results button - redirect to results
            return NextResponse.redirect(new URL(`/api/frame/results?gameId=${gameId}`, req.url));
          }
          break;

        case 2:
          // Second button - varies by phase
          if (game.phase === 'day') {
            // Vote button - redirect to voting
            return NextResponse.redirect(new URL(`/api/frame/vote?gameId=${gameId}`, req.url));
          } else if (game.phase === 'night' && userRole === 'mafia') {
            // Mafia chat button - redirect to mafia chat
            return NextResponse.redirect(new URL(`/api/frame/mafia-chat?gameId=${gameId}`, req.url));
          } else if (game.phase === 'ended') {
            // New game button - redirect to main
            return NextResponse.redirect(new URL('/api/frame', req.url));
          }
          break;

        case 3:
          // Third button - usually refresh
          break;

        default:
          break;
      }

      // Default: return current game frame (refresh)
      return new NextResponse(createGameFrame(gameId, game.phase, game.round, userRole), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });

    } catch (error) {
      console.error('Error in game frame:', error);
      return new NextResponse(createErrorFrame('Failed to load game. Please try again.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }

  } catch (error) {
    console.error('Error parsing game frame action:', error);
    return new NextResponse(createErrorFrame('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}