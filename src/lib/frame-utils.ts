import { FrameResponse, FrameButton } from './types';

export function createFrameHtml(response: FrameResponse): string {
  const buttons = response.buttons || [];
  const buttonElements = buttons
    .slice(0, 4) // Max 4 buttons
    .map((button, index) => {
      const action = button.action || 'post';
      const target = button.target || response.postUrl || '';
      return `
        <meta property="fc:frame:button:${index + 1}" content="${button.label}" />
        <meta property="fc:frame:button:${index + 1}:action" content="${action}" />
        ${target ? `<meta property="fc:frame:button:${index + 1}:target" content="${target}" />` : ''}
      `;
    })
    .join('');

  const inputText = response.inputText
    ? `<meta property="fc:frame:input:text" content="${response.inputText}" />`
    : '';

  const postUrl = response.postUrl
    ? `<meta property="fc:frame:post_url" content="${response.postUrl}" />`
    : '';

  const state = response.state
    ? `<meta property="fc:frame:state" content="${response.state}" />`
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${response.image}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    ${buttonElements}
    ${inputText}
    ${postUrl}
    ${state}
    <meta property="og:title" content="MafiaChain" />
    <meta property="og:description" content="Multiplayer Mafia game with ETH prizes on Farcaster" />
    <meta property="og:image" content="${response.image}" />
    <title>MafiaChain</title>
  </head>
  <body>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif;">
      <h1>🎭 MafiaChain</h1>
      <p>Multiplayer Mafia game with ETH prizes!</p>
      <img src="${response.image}" alt="Game State" style="max-width: 600px; border-radius: 8px;" />
    </div>
  </body>
</html>`;
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

export function createImageUrl(params: Record<string, string>): string {
  const baseUrl = getBaseUrl();
  const searchParams = new URLSearchParams(params);
  return `${baseUrl}/api/og?${searchParams.toString()}`;
}

export function createPostUrl(endpoint: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/frame/${endpoint}`;
}

export function parseFrameAction(body: any) {
  try {
    const { untrustedData, trustedData } = body;

    // Basic validation
    if (!untrustedData || !trustedData) {
      throw new Error('Invalid frame action payload');
    }

    return {
      fid: untrustedData.fid.toString(),
      buttonIndex: untrustedData.buttonIndex,
      inputText: untrustedData.inputText || '',
      castHash: untrustedData.castId?.hash,
      url: untrustedData.url,
      timestamp: untrustedData.timestamp,
      messageBytes: trustedData.messageBytes,
    };
  } catch (error) {
    console.error('Error parsing frame action:', error);
    throw new Error('Failed to parse frame action');
  }
}

export function createErrorFrame(message: string): string {
  const response: FrameResponse = {
    image: createImageUrl({
      type: 'error',
      message: message.slice(0, 100) // Limit message length
    }),
    buttons: [
      { label: '🔄 Try Again', action: 'post', target: createPostUrl('') }
    ],
    postUrl: createPostUrl('')
  };

  return createFrameHtml(response);
}

export function createLobbyFrame(gameId: string, playerCount: number, isHost: boolean): string {
  const buttons: FrameButton[] = [];

  if (isHost && playerCount === 9) {
    buttons.push({ label: '🚀 Start Game', action: 'post', target: createPostUrl(`start?gameId=${gameId}`) });
  }

  buttons.push(
    { label: '🔄 Refresh', action: 'post', target: createPostUrl(`lobby?gameId=${gameId}`) },
    { label: '👥 Share', action: 'link', target: `https://warpcast.com/~/compose?text=Join my MafiaChain game! 🎭&embeds[]=${getBaseUrl()}/api/frame/join?gameId=${gameId}` }
  );

  const response: FrameResponse = {
    image: createImageUrl({
      type: 'lobby',
      gameId,
      playerCount: playerCount.toString(),
      isHost: isHost.toString()
    }),
    buttons,
    postUrl: createPostUrl(`lobby?gameId=${gameId}`)
  };

  return createFrameHtml(response);
}

export function createGameFrame(gameId: string, phase: string, round: number, userRole?: string): string {
  const buttons: FrameButton[] = [];

  switch (phase) {
    case 'day':
      buttons.push(
        { label: '💬 Chat', action: 'post', target: createPostUrl(`chat?gameId=${gameId}`) },
        { label: '🗳️ Vote', action: 'post', target: createPostUrl(`vote?gameId=${gameId}`) },
        { label: '🔄 Refresh', action: 'post', target: createPostUrl(`game?gameId=${gameId}`) }
      );
      break;

    case 'night':
      if (userRole === 'mafia') {
        buttons.push(
          { label: '🔪 Kill', action: 'post', target: createPostUrl(`kill?gameId=${gameId}`) },
          { label: '💬 Mafia Chat', action: 'post', target: createPostUrl(`mafia-chat?gameId=${gameId}`) }
        );
      } else if (userRole === 'doctor') {
        buttons.push(
          { label: '💊 Save', action: 'post', target: createPostUrl(`save?gameId=${gameId}`) }
        );
      }
      buttons.push({ label: '🔄 Refresh', action: 'post', target: createPostUrl(`game?gameId=${gameId}`) });
      break;

    case 'ended':
      buttons.push(
        { label: '📊 Results', action: 'post', target: createPostUrl(`results?gameId=${gameId}`) },
        { label: '🎮 New Game', action: 'post', target: createPostUrl('') }
      );
      break;

    default:
      buttons.push({ label: '🔄 Refresh', action: 'post', target: createPostUrl(`game?gameId=${gameId}`) });
  }

  const response: FrameResponse = {
    image: createImageUrl({
      type: 'game',
      gameId,
      phase,
      round: round.toString(),
      userRole: userRole || 'spectator'
    }),
    buttons,
    postUrl: createPostUrl(`game?gameId=${gameId}`)
  };

  return createFrameHtml(response);
}