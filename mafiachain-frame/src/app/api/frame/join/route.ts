import { NextRequest, NextResponse } from 'next/server';
import { createFrameHtml, createImageUrl, createPostUrl, parseFrameAction, createErrorFrame, createLobbyFrame } from '@/lib/frame-utils';
import { GameEngine } from '@/lib/game-engine';
import { FrameResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');

  if (gameId) {
    // Join specific game
    const response: FrameResponse = {
      image: createImageUrl({
        type: 'join-specific',
        gameId,
        title: 'Join Game',
        subtitle: 'Ready to play MafiaChain?'
      }),
      buttons: [
        { label: '🚪 Join Game', action: 'post', target: createPostUrl(`join?gameId=${gameId}`) },
        { label: '🔙 Back', action: 'post', target: createPostUrl('') }
      ],
      postUrl: createPostUrl(`join?gameId=${gameId}`)
    };

    return new NextResponse(createFrameHtml(response), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Generic join form
  const response: FrameResponse = {
    image: createImageUrl({
      type: 'join',
      title: 'Join Game',
      subtitle: 'Enter game ID or join a public game'
    }),
    buttons: [
      { label: '🎲 Find Game', action: 'post', target: createPostUrl('find') },
      { label: '🔙 Back', action: 'post', target: createPostUrl('') }
    ],
    inputText: 'Enter Game ID',
    postUrl: createPostUrl('join')
  };

  return new NextResponse(createFrameHtml(response), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = parseFrameAction(body);
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (action.buttonIndex === 2) {
      // Back button
      return NextResponse.redirect(new URL('/api/frame', req.url));
    }

    if (action.buttonIndex === 1) {
      let targetGameId = gameId;

      // If no gameId in URL, try to get from input
      if (!targetGameId && action.inputText) {
        targetGameId = action.inputText.trim();
      }

      if (!targetGameId) {
        return new NextResponse(createErrorFrame('Please provide a valid game ID.'), {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      const playerFid = action.fid;

      try {
        // Check if game exists
        const game = await GameEngine.getGame(targetGameId);
        if (!game) {
          return new NextResponse(createErrorFrame('Game not found. Please check the game ID.'), {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
          });
        }

        if (game.phase !== 'lobby') {
          return new NextResponse(createErrorFrame('Game has already started or ended.'), {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          });
        }

        if (game.playerOrder.length >= 9) {
          return new NextResponse(createErrorFrame('Game is full.'), {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          });
        }

        // Add player to game
        const success = await GameEngine.addPlayer(targetGameId, playerFid, {
          username: `player_${playerFid}`,
          displayName: `Player ${playerFid}`,
        });

        if (!success) {
          return new NextResponse(createErrorFrame('Failed to join game. You may already be in this game.'), {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          });
        }

        // Get updated game state
        const updatedGame = await GameEngine.getGame(targetGameId);
        const isHost = updatedGame?.host === playerFid;

        // Return lobby frame
        return new NextResponse(createLobbyFrame(targetGameId, updatedGame?.playerOrder.length || 1, isHost), {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });

      } catch (error) {
        console.error('Error joining game:', error);
        return new NextResponse(createErrorFrame('Failed to join game. Please try again.'), {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

    // Default response for other button actions
    const response: FrameResponse = {
      image: createImageUrl({
        type: 'join',
        title: 'Join Game',
        subtitle: 'Enter game ID or join a public game'
      }),
      buttons: [
        { label: '🎲 Find Game', action: 'post', target: createPostUrl('find') },
        { label: '🔙 Back', action: 'post', target: createPostUrl('') }
      ],
      inputText: 'Enter Game ID',
      postUrl: createPostUrl('join')
    };

    return new NextResponse(createFrameHtml(response), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in join frame:', error);
    return new NextResponse(createErrorFrame('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}