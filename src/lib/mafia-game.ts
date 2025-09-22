export type Role = 'mafia' | 'doctor' | 'god' | 'villager';
export type Phase = 'lobby' | 'day' | 'night' | 'ended';
export type GameState = 'waiting' | 'started' | 'ended';

export interface Player {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  role?: Role;
  isAlive: boolean;
  isHost: boolean;
  walletAddress?: string;
  acknowledged: boolean;
}

export interface Game {
  gameId: string;
  players: Player[];
  state: GameState;
  phase: Phase;
  round: number;
  timeLeft: number;
  hostFid: number;
  createdAt: number;
  dayVotes: Record<number, number>; // voterFid -> targetFid
  nightActions: {
    mafiaKill?: number;
    doctorSave?: number;
  };
  eliminated: number[];
  messages: GameMessage[];
}

export interface GameMessage {
  id: string;
  fromFid: number;
  content: string;
  timestamp: number;
  isPrivate?: boolean;
  targetRole?: Role;
}

export class MafiaGame {
  private game: Game;

  constructor(gameId: string, hostFid: number, hostUsername: string) {
    this.game = {
      gameId,
      players: [{
        fid: hostFid,
        username: hostUsername,
        isAlive: true,
        isHost: true,
        acknowledged: false
      }],
      state: 'waiting',
      phase: 'lobby',
      round: 0,
      timeLeft: 0,
      hostFid,
      createdAt: Date.now(),
      dayVotes: {},
      nightActions: {},
      eliminated: [],
      messages: []
    };
  }

  addPlayer(fid: number, username: string, displayName?: string, pfpUrl?: string): boolean {
    if (this.game.players.length >= 9 || this.game.state !== 'waiting') {
      return false;
    }

    this.game.players.push({
      fid,
      username,
      displayName,
      pfpUrl,
      isAlive: true,
      isHost: false,
      acknowledged: false
    });

    return true;
  }

  removePlayer(fid: number): boolean {
    if (this.game.state !== 'waiting') return false;

    const index = this.game.players.findIndex(p => p.fid === fid);
    if (index === -1) return false;

    this.game.players.splice(index, 1);
    return true;
  }

  assignRoles(): void {
    if (this.game.players.length !== 9) {
      throw new Error('Need exactly 9 players to start');
    }

    const roles: Role[] = ['mafia', 'mafia', 'doctor', 'god', 'villager', 'villager', 'villager', 'villager', 'villager'];
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);

    this.game.players.forEach((player, index) => {
      player.role = shuffledRoles[index];
    });

    this.game.state = 'started';
    this.game.phase = 'day';
    this.game.round = 1;
    this.game.timeLeft = 5 * 60; // 5 minutes for day phase
  }

  startGame(): boolean {
    if (this.game.players.length !== 9 || this.game.state !== 'waiting') {
      return false;
    }

    this.assignRoles();
    return true;
  }

  submitDayVote(voterFid: number, targetFid: number): boolean {
    if (this.game.phase !== 'day') return false;

    const voter = this.game.players.find(p => p.fid === voterFid);
    if (!voter || !voter.isAlive) return false;

    const target = this.game.players.find(p => p.fid === targetFid);
    if (!target || !target.isAlive) return false;

    this.game.dayVotes[voterFid] = targetFid;
    return true;
  }

  submitNightAction(playerFid: number, targetFid: number, action: 'kill' | 'save'): boolean {
    if (this.game.phase !== 'night') return false;

    const player = this.game.players.find(p => p.fid === playerFid);
    if (!player || !player.isAlive) return false;

    if (action === 'kill' && player.role === 'mafia') {
      this.game.nightActions.mafiaKill = targetFid;
      return true;
    }

    if (action === 'save' && player.role === 'doctor') {
      this.game.nightActions.doctorSave = targetFid;
      return true;
    }

    return false;
  }

  resolveDay(): { eliminated: number | null, votes: Record<number, number> } {
    const voteCounts: Record<number, number> = {};

    Object.values(this.game.dayVotes).forEach(targetFid => {
      voteCounts[targetFid] = (voteCounts[targetFid] || 0) + 1;
    });

    let maxVotes = 0;
    let eliminated: number | null = null;

    Object.entries(voteCounts).forEach(([fid, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminated = parseInt(fid);
      }
    });

    if (eliminated && maxVotes > 0) {
      const player = this.game.players.find(p => p.fid === eliminated);
      if (player) {
        player.isAlive = false;
        this.game.eliminated.push(eliminated);
      }
    }

    this.game.dayVotes = {};
    return { eliminated, votes: voteCounts };
  }

  resolveNight(): { killed: number | null, saved: boolean } {
    const { mafiaKill, doctorSave } = this.game.nightActions;
    let killed: number | null = null;
    let saved = false;

    if (mafiaKill) {
      if (doctorSave === mafiaKill) {
        saved = true;
      } else {
        const player = this.game.players.find(p => p.fid === mafiaKill);
        if (player) {
          player.isAlive = false;
          this.game.eliminated.push(mafiaKill);
          killed = mafiaKill;
        }
      }
    }

    this.game.nightActions = {};
    return { killed, saved };
  }

  checkWinCondition(): { winner: 'mafia' | 'villagers' | null, gameEnded: boolean } {
    const alivePlayers = this.game.players.filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === 'mafia');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'mafia');

    if (aliveMafia.length === 0) {
      this.game.state = 'ended';
      this.game.phase = 'ended';
      return { winner: 'villagers', gameEnded: true };
    }

    if (aliveMafia.length >= aliveVillagers.length) {
      this.game.state = 'ended';
      this.game.phase = 'ended';
      return { winner: 'mafia', gameEnded: true };
    }

    if (this.game.round >= 3) {
      this.game.state = 'ended';
      this.game.phase = 'ended';
      return { winner: aliveMafia.length > 0 ? 'mafia' : 'villagers', gameEnded: true };
    }

    return { winner: null, gameEnded: false };
  }

  nextPhase(): void {
    if (this.game.phase === 'day') {
      this.game.phase = 'night';
      this.game.timeLeft = 2.5 * 60; // 2.5 minutes for night
    } else if (this.game.phase === 'night') {
      this.game.round++;
      this.game.phase = 'day';
      this.game.timeLeft = 5 * 60; // 5 minutes for day
    }
  }

  addMessage(fromFid: number, content: string, isPrivate = false, targetRole?: Role): void {
    this.game.messages.push({
      id: Date.now().toString(),
      fromFid,
      content,
      timestamp: Date.now(),
      isPrivate,
      targetRole
    });
  }

  acknowledgeRole(fid: number): void {
    const player = this.game.players.find(p => p.fid === fid);
    if (player) {
      player.acknowledged = true;
    }
  }

  getGameState(): Game {
    return { ...this.game };
  }

  getPlayerRole(fid: number): Role | undefined {
    const player = this.game.players.find(p => p.fid === fid);
    return player?.role;
  }

  isPlayerAlive(fid: number): boolean {
    const player = this.game.players.find(p => p.fid === fid);
    return player?.isAlive || false;
  }

  getMafiaPartner(fid: number): Player | null {
    const player = this.game.players.find(p => p.fid === fid);
    if (player?.role !== 'mafia') return null;

    return this.game.players.find(p => p.role === 'mafia' && p.fid !== fid) || null;
  }

  getMessagesForPlayer(fid: number): GameMessage[] {
    const player = this.game.players.find(p => p.fid === fid);
    if (!player) return [];

    return this.game.messages.filter(msg => {
      if (!msg.isPrivate) return true;
      if (msg.fromFid === fid) return true;
      if (msg.targetRole && player.role === msg.targetRole) return true;
      return false;
    });
  }
}