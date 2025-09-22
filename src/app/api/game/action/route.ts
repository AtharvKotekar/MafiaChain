import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { MafiaGame } from '@/lib/mafia-game';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, fid, action, target, message } = body;

    if (!gameId || !fid || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current game state
    const gameData = await redis.get(`game:${gameId}`);
    if (!gameData) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const gameState = JSON.parse(gameData as string);

    // Recreate game instance
    const game = new MafiaGame(gameState.gameId, gameState.hostFid, '');
    Object.assign(game, { game: gameState });

    const result: { success: boolean; [key: string]: unknown } = { success: false };

    switch (action) {
      case 'vote':
        if (target) {
          result.success = game.submitDayVote(fid, target);
        }
        break;

      case 'kill':
        if (target) {
          result.success = game.submitNightAction(fid, target, 'kill');
        }
        break;

      case 'save':
        if (target) {
          result.success = game.submitNightAction(fid, target, 'save');
        }
        break;

      case 'chat':
        if (message) {
          const userRole = game.getPlayerRole(fid);
          const isPrivate = gameState.phase === 'night' && userRole === 'mafia';
          game.addMessage(fid, message, isPrivate, isPrivate ? 'mafia' : undefined);
          result.success = true;
        }
        break;

      case 'acknowledge_role':
        game.acknowledgeRole(fid);
        result.success = true;
        break;

      case 'next_phase':
        // Only host can advance phases
        if (gameState.hostFid === fid) {
          if (gameState.phase === 'day') {
            const { eliminated, votes } = game.resolveDay();
            result.eliminated = eliminated;
            result.votes = votes;
          } else if (gameState.phase === 'night') {
            const { killed, saved } = game.resolveNight();
            result.killed = killed;
            result.saved = saved;
          }

          const { winner, gameEnded } = game.checkWinCondition();
          if (gameEnded) {
            result.gameEnded = true;
            result.winner = winner;
          } else {
            game.nextPhase();
          }
          result.success = true;
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: 'Action failed' }, { status: 400 });
    }

    // Update game in Redis
    await redis.setex(`game:${gameId}`, 7200, JSON.stringify(game.getGameState()));

    // Publish event for real-time updates
    await redis.publish(`game:${gameId}:events`, JSON.stringify({
      type: action,
      fid,
      target,
      message,
      result,
      gameState: game.getGameState()
    }));

    return NextResponse.json({
      success: true,
      result,
      gameState: game.getGameState()
    });

  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}