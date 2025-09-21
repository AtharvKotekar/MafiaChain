import { redisHelpers } from './redis';
import { GameState, Player, Role, GamePhase, GAME_CONFIG, WIN_CONDITIONS } from './types';

export class GameEngine {
  /**
   * Create a new game
   */
  static async createGame(hostFid: string): Promise<string> {
    const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const gameState: GameState = {
      id: gameId,
      phase: 'lobby',
      round: 0,
      players: {},
      playerOrder: [],
      host: hostFid,
      phaseStartTime: Date.now(),
      phaseEndTime: Date.now() + (10 * 60 * 1000), // 10 min lobby timeout
      winners: [],
      contractGameStarted: false,
      contractGameFinalized: false,
      history: [{
        type: 'game_started',
        timestamp: Date.now(),
        data: { gameId, hostFid }
      }]
    };

    await redisHelpers.setGame(gameId, gameState);
    await redisHelpers.addToGameIndex(gameId, 'lobby');

    return gameId;
  }

  /**
   * Add player to game
   */
  static async addPlayer(gameId: string, fid: string, userData: Partial<Player> = {}): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || game.phase !== 'lobby' || game.playerOrder.length >= GAME_CONFIG.MAX_PLAYERS) {
      return false;
    }

    if (game.players[fid]) {
      return false; // Already in game
    }

    const player: Player = {
      fid,
      username: userData.username || `player${fid}`,
      displayName: userData.displayName || `Player ${fid}`,
      avatarUrl: userData.avatarUrl,
      walletAddress: userData.walletAddress,
      isAlive: true,
      ackReceived: false,
      paid: false,
      joinedAt: Date.now(),
      ...userData
    };

    game.players[fid] = player;
    game.playerOrder.push(fid);

    game.history.push({
      type: 'player_joined',
      timestamp: Date.now(),
      data: { fid, playerCount: game.playerOrder.length }
    });

    await redisHelpers.setGame(gameId, game);
    return true;
  }

  /**
   * Assign roles to players
   */
  static assignRoles(playerFids: string[]): Record<string, Role> {
    const shuffled = [...playerFids].sort(() => Math.random() - 0.5);
    const roles: Record<string, Role> = {};

    // Assign roles according to config
    let index = 0;

    // Assign mafia
    for (let i = 0; i < GAME_CONFIG.ROLES.MAFIA_COUNT; i++) {
      roles[shuffled[index++]] = 'mafia';
    }

    // Assign doctor
    for (let i = 0; i < GAME_CONFIG.ROLES.DOCTOR_COUNT; i++) {
      roles[shuffled[index++]] = 'doctor';
    }

    // Assign god
    for (let i = 0; i < GAME_CONFIG.ROLES.GOD_COUNT; i++) {
      roles[shuffled[index++]] = 'god';
    }

    // Assign villagers
    for (let i = 0; i < GAME_CONFIG.ROLES.VILLAGER_COUNT; i++) {
      roles[shuffled[index++]] = 'villager';
    }

    return roles;
  }

  /**
   * Start the game and assign roles
   */
  static async startGame(gameId: string): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || game.phase !== 'lobby' || game.playerOrder.length !== GAME_CONFIG.MAX_PLAYERS) {
      return false;
    }

    // Assign roles
    const roleAssignments = this.assignRoles(game.playerOrder);

    // Update players with roles
    for (const [fid, role] of Object.entries(roleAssignments)) {
      game.players[fid].role = role;
    }

    // Update game state
    game.phase = 'starting';
    game.round = 1;
    game.startTime = Date.now();
    game.phaseStartTime = Date.now();
    game.phaseEndTime = Date.now() + GAME_CONFIG.PHASE_DURATIONS.STARTING;

    game.history.push({
      type: 'phase_change',
      timestamp: Date.now(),
      data: { phase: 'starting', round: 1 }
    });

    await redisHelpers.setGame(gameId, game);
    await redisHelpers.removeFromGameIndex(gameId, 'lobby');
    await redisHelpers.addToGameIndex(gameId, 'starting');

    return true;
  }

  /**
   * Transition to day phase
   */
  static async startDayPhase(gameId: string): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || !['starting', 'night'].includes(game.phase)) {
      return false;
    }

    game.phase = 'day';
    game.phaseStartTime = Date.now();
    game.phaseEndTime = Date.now() + GAME_CONFIG.PHASE_DURATIONS.DAY;

    game.history.push({
      type: 'phase_change',
      timestamp: Date.now(),
      data: { phase: 'day', round: game.round }
    });

    await redisHelpers.setGame(gameId, game);
    await redisHelpers.removeFromGameIndex(gameId, game.phase === 'starting' ? 'starting' : 'night');
    await redisHelpers.addToGameIndex(gameId, 'day');

    return true;
  }

  /**
   * Transition to night phase
   */
  static async startNightPhase(gameId: string): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || game.phase !== 'day') {
      return false;
    }

    game.phase = 'night';
    game.phaseStartTime = Date.now();
    game.phaseEndTime = Date.now() + GAME_CONFIG.PHASE_DURATIONS.NIGHT;

    game.history.push({
      type: 'phase_change',
      timestamp: Date.now(),
      data: { phase: 'night', round: game.round }
    });

    await redisHelpers.setGame(gameId, game);
    await redisHelpers.removeFromGameIndex(gameId, 'day');
    await redisHelpers.addToGameIndex(gameId, 'night');

    return true;
  }

  /**
   * Resolve night actions
   */
  static async resolveNight(gameId: string): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || game.phase !== 'night') {
      return false;
    }

    // Get mafia votes
    const mafiaVotes = await redisHelpers.getAllVotes(gameId, 'mafia');
    const doctorSave = await redisHelpers.getAllVotes(gameId, 'doctor');

    // Determine mafia target (majority vote)
    const voteCount: Record<string, number> = {};
    Object.values(mafiaVotes).forEach(target => {
      voteCount[target] = (voteCount[target] || 0) + 1;
    });

    let mafiaTarget: string | null = null;
    let maxVotes = 0;
    Object.entries(voteCount).forEach(([target, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        mafiaTarget = target;
      }
    });

    // Get doctor's save target
    const doctorSaveTarget = Object.values(doctorSave)[0] || null;

    // Resolve actions
    let killedPlayer: string | null = null;
    if (mafiaTarget && mafiaTarget !== doctorSaveTarget) {
      killedPlayer = mafiaTarget;
      game.players[killedPlayer].isAlive = false;
      game.lastKilled = killedPlayer;
    }

    game.killedTonight = killedPlayer;
    game.savedTonight = doctorSaveTarget;

    // Add to history
    if (killedPlayer) {
      game.history.push({
        type: 'player_killed',
        timestamp: Date.now(),
        data: { fid: killedPlayer, saved: false }
      });
    } else if (mafiaTarget === doctorSaveTarget) {
      game.history.push({
        type: 'player_saved',
        timestamp: Date.now(),
        data: { fid: mafiaTarget, doctor: Object.keys(doctorSave)[0] }
      });
    }

    // Check win conditions
    const winCondition = this.checkWinCondition(game);
    if (winCondition) {
      game.phase = 'ended';
      game.winner = winCondition === WIN_CONDITIONS.MAFIA_WIN ? 'mafia' : 'villagers';
      game.winners = this.getWinners(game);

      game.history.push({
        type: 'game_ended',
        timestamp: Date.now(),
        data: { winner: game.winner, winners: game.winners }
      });

      await redisHelpers.removeFromGameIndex(gameId, 'night');
      await redisHelpers.addToGameIndex(gameId, 'ended');
    } else {
      // Check if max rounds reached
      if (game.round >= GAME_CONFIG.MAX_ROUNDS) {
        game.phase = 'ended';
        game.winner = 'villagers'; // Villagers win if game goes to max rounds
        game.winners = this.getWinners(game);

        game.history.push({
          type: 'game_ended',
          timestamp: Date.now(),
          data: { winner: game.winner, winners: game.winners, reason: 'max_rounds' }
        });

        await redisHelpers.removeFromGameIndex(gameId, 'night');
        await redisHelpers.addToGameIndex(gameId, 'ended');
      } else {
        // Move to next round
        game.round++;
      }
    }

    await redisHelpers.setGame(gameId, game);
    return true;
  }

  /**
   * Check win conditions
   */
  static checkWinCondition(game: GameState): string | null {
    const alivePlayers = Object.values(game.players).filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === 'mafia');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'mafia');

    // Mafia win if they equal or outnumber villagers
    if (aliveMafia.length >= aliveVillagers.length) {
      return WIN_CONDITIONS.MAFIA_WIN;
    }

    // Villagers win if no mafia left
    if (aliveMafia.length === 0) {
      return WIN_CONDITIONS.VILLAGERS_WIN;
    }

    return null;
  }

  /**
   * Get winners list
   */
  static getWinners(game: GameState): string[] {
    if (game.winner === 'mafia') {
      return Object.values(game.players)
        .filter(p => p.role === 'mafia' && p.isAlive)
        .map(p => p.fid);
    } else {
      return Object.values(game.players)
        .filter(p => p.role !== 'mafia' && p.isAlive)
        .map(p => p.fid);
    }
  }

  /**
   * Get game state
   */
  static async getGame(gameId: string): Promise<GameState | null> {
    return await redisHelpers.getGame(gameId);
  }

  /**
   * Mark player as paid
   */
  static async markPlayerPaid(gameId: string, fid: string): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || !game.players[fid]) {
      return false;
    }

    game.players[fid].paid = true;
    await redisHelpers.setGame(gameId, game);
    return true;
  }

  /**
   * Mark player role acknowledged
   */
  static async markRoleAcknowledged(gameId: string, fid: string): Promise<boolean> {
    const game = await redisHelpers.getGame(gameId);
    if (!game || !game.players[fid]) {
      return false;
    }

    game.players[fid].ackReceived = true;
    await redisHelpers.setGame(gameId, game);
    return true;
  }

  /**
   * Get alive players with specific role
   */
  static getAlivePlayersWithRole(game: GameState, role: Role): Player[] {
    return Object.values(game.players).filter(p => p.isAlive && p.role === role);
  }

  /**
   * Get alive players
   */
  static getAlivePlayers(game: GameState): Player[] {
    return Object.values(game.players).filter(p => p.isAlive);
  }
}