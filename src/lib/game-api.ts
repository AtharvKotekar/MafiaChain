export interface GameAPIResponse<T = unknown> {
  success: boolean;
  error?: string;
  gameState?: unknown;
  result?: T;
}

export class GameAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async createGame(fid: number, username: string, displayName?: string): Promise<GameAPIResponse<{ gameId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, username, displayName })
      });

      return await response.json();
    } catch (error) {
      console.error('Create game error:', error);
      return { success: false, error: 'Failed to create game' };
    }
  }

  async joinGame(gameId: string, fid: number, username: string, displayName?: string, pfpUrl?: string): Promise<GameAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, fid, username, displayName, pfpUrl })
      });

      return await response.json();
    } catch (error) {
      console.error('Join game error:', error);
      return { success: false, error: 'Failed to join game' };
    }
  }

  async getGameState(gameId: string): Promise<GameAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game/state?gameId=${gameId}`);
      return await response.json();
    } catch (error) {
      console.error('Get game state error:', error);
      return { success: false, error: 'Failed to get game state' };
    }
  }

  async startGame(gameId: string, fid: number): Promise<GameAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, fid })
      });

      return await response.json();
    } catch (error) {
      console.error('Start game error:', error);
      return { success: false, error: 'Failed to start game' };
    }
  }

  async submitAction(gameId: string, fid: number, action: string, target?: number, message?: string): Promise<GameAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, fid, action, target, message })
      });

      return await response.json();
    } catch (error) {
      console.error('Submit action error:', error);
      return { success: false, error: 'Failed to submit action' };
    }
  }

  // Real-time polling for game updates
  startPolling(gameId: string, callback: (gameState: unknown) => void, intervalMs: number = 2000): () => void {
    const poll = async () => {
      const response = await this.getGameState(gameId);
      if (response.success && response.gameState) {
        callback(response.gameState);
      }
    };

    const interval = setInterval(poll, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  // Payment integration
  async payEntryFee(gameId: string, fid: number, walletAddress: string): Promise<GameAPIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/game/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, fid, walletAddress })
      });

      return await response.json();
    } catch (error) {
      console.error('Payment error:', error);
      return { success: false, error: 'Payment failed' };
    }
  }
}

export const gameAPI = new GameAPI();