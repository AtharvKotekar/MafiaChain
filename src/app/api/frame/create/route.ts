import { NextRequest, NextResponse } from 'next/server';
import { createFrameHtml, createImageUrl, createPostUrl, parseFrameAction, createErrorFrame, createLobbyFrame } from '@/lib/frame-utils';
import { GameEngine } from '@/lib/game-engine';
import { FrameResponse } from '@/lib/types';

export async function GET() {
  // Show create game form
  const response: FrameResponse = {
    image: createImageUrl({
      type: 'create',
      title: 'Create New Game',
      subtitle: 'Entry: 0.001 ETH • 9 Players • Winner takes all'
    }),
    buttons: [
      { label: '🎭 Create Game', action: 'post', target: createPostUrl('create') },
      { label: '🔙 Back', action: 'post', target: createPostUrl('') }
    ],
    postUrl: createPostUrl('create')
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

    if (action.buttonIndex === 2) {
      // Back button - redirect to main
      return NextResponse.redirect(new URL('/api/frame', req.url));
    }

    if (action.buttonIndex === 1) {
      // Create game
      const hostFid = action.fid;

      try {
        const gameId = await GameEngine.createGame(hostFid);

        // Add host as first player
        const success = await GameEngine.addPlayer(gameId, hostFid, {
          username: `host_${hostFid}`,
          displayName: `Host ${hostFid}`,
        });

        if (!success) {
          throw new Error('Failed to add host to game');
        }

        // Return lobby frame
        return new NextResponse(createLobbyFrame(gameId, 1, true), {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });

      } catch (error) {
        console.error('Error creating game:', error);
        return new NextResponse(createErrorFrame('Failed to create game. Please try again.'), {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

    // Default response
    const response: FrameResponse = {
      image: createImageUrl({
        type: 'create',
        title: 'Create New Game',
        subtitle: 'Entry: 0.001 ETH • 9 Players • Winner takes all'
      }),
      buttons: [
        { label: '🎭 Create Game', action: 'post', target: createPostUrl('create') },
        { label: '🔙 Back', action: 'post', target: createPostUrl('') }
      ],
      postUrl: createPostUrl('create')
    };

    return new NextResponse(createFrameHtml(response), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in create frame:', error);
    return new NextResponse(createErrorFrame('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}