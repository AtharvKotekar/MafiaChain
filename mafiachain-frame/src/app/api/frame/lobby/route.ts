import { NextRequest, NextResponse } from 'next/server';
import { createLobbyFrame, parseFrameAction, createErrorFrame } from '@/lib/frame-utils';
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

      if (game.phase !== 'lobby') {
        // Redirect to game frame if game has started
        return NextResponse.redirect(new URL(`/api/frame/game?gameId=${gameId}`, req.url));
      }

      const isHost = game.host === playerFid;
      const playerCount = game.playerOrder.length;

      // Return updated lobby frame
      return new NextResponse(createLobbyFrame(gameId, playerCount, isHost), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });

    } catch (error) {
      console.error('Error in lobby frame:', error);
      return new NextResponse(createErrorFrame('Failed to load lobby. Please try again.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }

  } catch (error) {
    console.error('Error parsing lobby frame action:', error);
    return new NextResponse(createErrorFrame('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}