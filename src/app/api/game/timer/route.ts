import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { MafiaGame } from '@/lib/mafia-game';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    // Get game state
    const gameData = await redis.get(`game:${gameId}`);
    if (!gameData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameState = JSON.parse(gameData as string);

    // Check if game is active
    if (gameState.state !== 'started') {
      return NextResponse.json({ error: 'Game not active' }, { status: 400 });
    }

    // Recreate game instance
    const game = new MafiaGame(gameState.gameId, gameState.hostFid, '');
    Object.assign(game, { game: gameState });

    let phaseChanged = false;
    const result: { [key: string]: unknown } = {};

    // Auto-advance phase if time is up
    const currentTime = Date.now();
    const phaseStartTime = gameState.phaseStartTime || currentTime;
    const phaseLength = gameState.phase === 'day' ? 5 * 60 * 1000 : 2.5 * 60 * 1000; // 5 min day, 2.5 min night

    if (currentTime - phaseStartTime >= phaseLength) {
      if (gameState.phase === 'day') {
        const { eliminated, votes } = game.resolveDay();
        result.eliminated = eliminated;
        result.votes = votes;
        if (eliminated) {
          game.addMessage(0, `${gameState.players.find((p: { fid: number; username: string }) => p.fid === eliminated)?.username} was eliminated by vote!`);
        }
      } else if (gameState.phase === 'night') {
        const { killed, saved } = game.resolveNight();
        result.killed = killed;
        result.saved = saved;
        if (saved) {
          game.addMessage(0, `Someone was attacked but survived!`);
        } else if (killed) {
          game.addMessage(0, `${gameState.players.find((p: { fid: number; username: string }) => p.fid === killed)?.username} was killed in the night!`);
        }
      }

      const { winner, gameEnded } = game.checkWinCondition();
      if (gameEnded) {
        result.gameEnded = true;
        result.winner = winner;
        // Don't advance phase if game ended
      } else {
        game.nextPhase();
        // Set new phase start time in the game state
        const newGameState = game.getGameState();
        (newGameState as unknown as Record<string, unknown>).phaseStartTime = currentTime;
        Object.assign(game, { game: newGameState });
        phaseChanged = true;
      }

      // Update game state
      await redis.setex(`game:${gameId}`, 7200, JSON.stringify(game.getGameState()));

      // Publish phase change event
      await redis.publish(`game:${gameId}:events`, JSON.stringify({
        type: 'phase_auto_advance',
        result,
        phaseChanged,
        gameState: game.getGameState()
      }));
    }

    return NextResponse.json({
      success: true,
      phaseChanged,
      result,
      timeLeft: Math.max(0, phaseLength - (currentTime - phaseStartTime)),
      gameState: game.getGameState()
    });

  } catch (error) {
    console.error('Timer error:', error);
    return NextResponse.json({ error: 'Timer processing failed' }, { status: 500 });
  }
}