import { NextRequest, NextResponse } from 'next/server';
import { createFrameHtml, createImageUrl, createPostUrl, parseFrameAction, createErrorFrame } from '@/lib/frame-utils';
import { FrameResponse } from '@/lib/types';

export async function GET() {
  // Main landing frame
  const response: FrameResponse = {
    image: createImageUrl({
      type: 'landing',
      title: 'MafiaChain',
      subtitle: '9-player Mafia with ETH prizes!'
    }),
    buttons: [
      { label: '🎮 Create Game', action: 'post', target: createPostUrl('create') },
      { label: '🚪 Join Game', action: 'post', target: createPostUrl('join') },
      { label: '📖 Rules', action: 'link', target: 'https://github.com/your-repo/rules' },
      { label: '🏆 Leaderboard', action: 'post', target: createPostUrl('leaderboard') }
    ],
    postUrl: createPostUrl('')
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

    // For the main frame, handle button actions
    switch (action.buttonIndex) {
      case 1: // Create Game
        return NextResponse.redirect(new URL('/api/frame/create', req.url));

      case 2: // Join Game
        return NextResponse.redirect(new URL('/api/frame/join', req.url));

      case 4: // Leaderboard
        return NextResponse.redirect(new URL('/api/frame/leaderboard', req.url));

      default:
        const response: FrameResponse = {
          image: createImageUrl({
            type: 'landing',
            title: 'MafiaChain',
            subtitle: '9-player Mafia with ETH prizes!'
          }),
          buttons: [
            { label: '🎮 Create Game', action: 'post', target: createPostUrl('create') },
            { label: '🚪 Join Game', action: 'post', target: createPostUrl('join') },
            { label: '📖 Rules', action: 'link', target: 'https://github.com/your-repo/rules' },
            { label: '🏆 Leaderboard', action: 'post', target: createPostUrl('leaderboard') }
          ],
          postUrl: createPostUrl('')
        };

        return new NextResponse(createFrameHtml(response), {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
    }

  } catch (error) {
    console.error('Error in main frame:', error);
    return new NextResponse(createErrorFrame('Something went wrong. Please try again.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}