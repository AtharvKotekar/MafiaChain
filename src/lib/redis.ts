import { Redis } from '@upstash/redis';

// Check if Redis config is available
const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('Redis configuration missing. Please set UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN in .env.local');
  console.error('Current values:', {
    url: redisUrl ? 'SET' : 'MISSING',
    token: redisToken ? 'SET' : 'MISSING'
  });
  throw new Error('Redis configuration missing. Please set UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Helper functions for Redis operations
export const redisHelpers = {
  // Game state operations
  async setGame(gameId: string, gameState: unknown, ttlSeconds = 86400) {
    return await redis.setex(`game:${gameId}`, ttlSeconds, JSON.stringify(gameState));
  },

  async getGame(gameId: string) {
    const data = await redis.get(`game:${gameId}`);
    return data ? JSON.parse(data as string) : null;
  },

  async deleteGame(gameId: string) {
    return await redis.del(`game:${gameId}`);
  },

  // Player session operations
  async setPlayerSession(fid: string, sessionData: unknown, ttlSeconds = 3600) {
    return await redis.setex(`session:${fid}`, ttlSeconds, JSON.stringify(sessionData));
  },

  async getPlayerSession(fid: string) {
    const data = await redis.get(`session:${fid}`);
    return data ? JSON.parse(data as string) : null;
  },

  // Game index operations (for finding active games)
  async addToGameIndex(gameId: string, phase: string) {
    return await redis.sadd(`games:${phase}`, gameId);
  },

  async removeFromGameIndex(gameId: string, phase: string) {
    return await redis.srem(`games:${phase}`, gameId);
  },

  async getGamesInPhase(phase: string) {
    return await redis.smembers(`games:${phase}`);
  },

  // Timer operations
  async setGameTimer(gameId: string, phase: string, expiresAt: number) {
    return await redis.setex(`timer:${gameId}:${phase}`,
      Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)),
      expiresAt.toString()
    );
  },

  async getGameTimer(gameId: string, phase: string) {
    const data = await redis.get(`timer:${gameId}:${phase}`);
    return data ? parseInt(data as string) : null;
  },

  // Player vote operations
  async setPlayerVote(gameId: string, voterId: string, targetId: string, voteType: string) {
    const key = `vote:${gameId}:${voteType}:${voterId}`;
    return await redis.setex(key, 300, targetId); // 5 min expiry
  },

  async getPlayerVote(gameId: string, voterId: string, voteType: string) {
    return await redis.get(`vote:${gameId}:${voteType}:${voterId}`);
  },

  async getAllVotes(gameId: string, voteType: string) {
    const pattern = `vote:${gameId}:${voteType}:*`;
    const keys = await redis.keys(pattern);
    const votes: Record<string, string> = {};

    for (const key of keys) {
      const voterId = key.split(':')[3];
      const targetId = await redis.get(key);
      if (targetId) {
        votes[voterId] = targetId as string;
      }
    }

    return votes;
  },

  // Utility operations
  async ping() {
    return await redis.ping();
  },

  async flushGameData(gameId: string) {
    const keys = await redis.keys(`*${gameId}*`);
    if (keys.length > 0) {
      return await redis.del(...keys);
    }
    return 0;
  }
};