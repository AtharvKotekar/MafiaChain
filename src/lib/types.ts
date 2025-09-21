export type Role = 'mafia' | 'doctor' | 'villager' | 'god';
export type GamePhase = 'lobby' | 'starting' | 'day' | 'night' | 'ended';
export type VoteType = 'mafia' | 'doctor' | 'day';

export interface Player {
  fid: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  walletAddress?: string;
  role?: Role;
  isAlive: boolean;
  ackReceived: boolean;
  paid: boolean;
  joinedAt: number;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  round: number;
  players: Record<string, Player>; // fid -> Player
  playerOrder: string[]; // ordered list of fids
  host: string; // host fid
  startTime?: number;
  phaseStartTime: number;
  phaseEndTime: number;
  killedTonight?: string;
  savedTonight?: string;
  lastKilled?: string;
  winner?: 'mafia' | 'villagers';
  winners: string[]; // fids of winners
  contractGameStarted: boolean;
  contractGameFinalized: boolean;
  history: GameEvent[];
}

export interface GameEvent {
  type: 'player_joined' | 'game_started' | 'phase_change' | 'player_killed' | 'player_saved' | 'game_ended';
  timestamp: number;
  data: any;
}

export interface FrameButton {
  label: string;
  action: 'post' | 'link';
  target?: string;
}

export interface FrameResponse {
  image: string;
  buttons?: FrameButton[];
  inputText?: string;
  postUrl?: string;
  state?: string;
}

export interface MafiaVote {
  voterId: string;
  targetId: string;
  timestamp: number;
}

export interface DoctorSave {
  doctorId: string;
  targetId: string;
  timestamp: number;
}

export interface DayVote {
  voterId: string;
  targetId: string;
  timestamp: number;
}

// Neynar types
export interface NeynarUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
  verifications: string[];
}

export interface FrameActionPayload {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    inputText?: string;
    castId: {
      fid: number;
      hash: string;
    };
  };
  trustedData: {
    messageBytes: string;
  };
}

// Contract types
export interface ContractGameInfo {
  players: string[];
  balance: bigint;
  started: boolean;
  startTime: bigint;
  finalized: boolean;
  winners: string[];
}

// Win condition helpers
export const WIN_CONDITIONS = {
  MAFIA_WIN: 'mafia_win',
  VILLAGERS_WIN: 'villagers_win',
  TIMEOUT: 'timeout'
} as const;

export const GAME_CONFIG = {
  MAX_PLAYERS: 9,
  MAX_ROUNDS: 3,
  PHASE_DURATIONS: {
    DAY: 5 * 60 * 1000, // 5 minutes
    NIGHT: 2 * 60 * 1000, // 2 minutes
    STARTING: 30 * 1000, // 30 seconds
  },
  ROLES: {
    MAFIA_COUNT: 2,
    DOCTOR_COUNT: 1,
    GOD_COUNT: 1,
    VILLAGER_COUNT: 5,
  }
} as const;