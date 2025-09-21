import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'landing';

    // Generate different images based on type
    switch (type) {
      case 'landing':
        return generateLandingImage(searchParams);
      case 'lobby':
        return generateLobbyImage(searchParams);
      case 'game':
        return generateGameImage(searchParams);
      case 'create':
        return generateCreateImage(searchParams);
      case 'join':
        return generateJoinImage(searchParams);
      case 'error':
        return generateErrorImage(searchParams);
      default:
        return generateLandingImage(searchParams);
    }
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

function generateLandingImage(searchParams: URLSearchParams) {
  const title = searchParams.get('title') || 'MafiaChain';
  const subtitle = searchParams.get('subtitle') || '9-player Mafia with ETH prizes!';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '120px',
              marginRight: '20px',
            }}
          >
            🎭
          </div>
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              margin: '0',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {title}
          </h1>
        </div>
        <p
          style={{
            fontSize: '32px',
            textAlign: 'center',
            margin: '0',
            opacity: 0.9,
          }}
        >
          {subtitle}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '60px',
            fontSize: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>💰</span>
            <span>0.001 ETH Entry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👥</span>
            <span>9 Players</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚡</span>
            <span>Base L2</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateLobbyImage(searchParams: URLSearchParams) {
  const gameId = searchParams.get('gameId') || 'game-xxx';
  const playerCount = parseInt(searchParams.get('playerCount') || '1');
  const isHost = searchParams.get('isHost') === 'true';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #2c1810, #3d2914, #4e3518)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '80px', marginRight: '20px' }}>🏛️</span>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0' }}>
            Game Lobby
          </h1>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '20px', opacity: 0.8 }}>
            Game ID: {gameId.slice(-8)}
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
            {playerCount} / 9 Players
          </div>
          {isHost && (
            <div
              style={{
                background: '#feca57',
                color: '#1a1a2e',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              👑 You are the Host
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '60px', fontSize: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⏱️</span>
            <span>Waiting for players...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>💰</span>
            <span>Entry: 0.001 ETH</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateGameImage(searchParams: URLSearchParams) {
  const phase = searchParams.get('phase') || 'day';
  const round = searchParams.get('round') || '1';
  const userRole = searchParams.get('userRole') || 'villager';

  const phaseEmoji = phase === 'day' ? '☀️' : phase === 'night' ? '🌙' : '🎯';
  const phaseColor = phase === 'day' ? '#feca57' : phase === 'night' ? '#3742fa' : '#2ed573';

  const roleEmoji = userRole === 'mafia' ? '🕴️' : userRole === 'doctor' ? '👨‍⚕️' : userRole === 'god' ? '👑' : '👤';

  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(45deg, ${phase === 'day' ? '#ff7675, #fdcb6e' : '#74b9ff, #6c5ce7'})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '80px', marginRight: '20px' }}>{phaseEmoji}</span>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0', textTransform: 'capitalize' }}>
            {phase} Phase
          </h1>
        </div>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '20px' }}>
            Round {round} of 3
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
            <span style={{ fontSize: '40px' }}>{roleEmoji}</span>
            <span style={{ fontSize: '28px', textTransform: 'capitalize' }}>
              You are: {userRole}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '24px', textAlign: 'center', opacity: 0.9 }}>
          {phase === 'day'
            ? '💬 Discuss and vote to eliminate suspects'
            : phase === 'night'
            ? '🤫 Night actions in progress...'
            : '🎯 Game in progress'}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateCreateImage(searchParams: URLSearchParams) {
  const title = searchParams.get('title') || 'Create New Game';
  const subtitle = searchParams.get('subtitle') || 'Entry: 0.001 ETH • 9 Players • Winner takes all';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #2d3436, #636e72, #74b9ff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '80px', marginRight: '20px' }}>🎮</span>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0' }}>
            {title}
          </h1>
        </div>
        <p
          style={{
            fontSize: '28px',
            textAlign: 'center',
            margin: '0',
            opacity: 0.9,
            maxWidth: '800px',
          }}
        >
          {subtitle}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateJoinImage(searchParams: URLSearchParams) {
  const title = searchParams.get('title') || 'Join Game';
  const subtitle = searchParams.get('subtitle') || 'Enter game ID or join a public game';
  const gameId = searchParams.get('gameId');

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #00b894, #00cec9, #74b9ff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '80px', marginRight: '20px' }}>🚪</span>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0' }}>
            {title}
          </h1>
        </div>
        <p
          style={{
            fontSize: '28px',
            textAlign: 'center',
            margin: '0',
            opacity: 0.9,
            maxWidth: '800px',
          }}
        >
          {subtitle}
        </p>
        {gameId && (
          <div
            style={{
              marginTop: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '20px 40px',
              borderRadius: '15px',
              fontSize: '24px',
              fontFamily: 'monospace',
            }}
          >
            Game ID: {gameId}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateErrorImage(searchParams: URLSearchParams) {
  const message = searchParams.get('message') || 'Something went wrong';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #d63031, #e17055, #fdcb6e)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span style={{ fontSize: '80px', marginRight: '20px' }}>⚠️</span>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', margin: '0' }}>
            Error
          </h1>
        </div>
        <p
          style={{
            fontSize: '28px',
            textAlign: 'center',
            margin: '0',
            opacity: 0.9,
            maxWidth: '800px',
          }}
        >
          {message}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}