'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { MafiaGame, Player, Role, Phase } from '@/lib/mafia-game';
import StartScreen from '@/components/StartScreen';
import NameAndAvatarScreen from '@/components/NameAndAvatarScreen';
import Image from 'next/image';

interface User {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

type View = 'start' | 'setup' | 'lobby' | 'game' | 'role' | 'chat' | 'vote' | 'results';

export default function MafiaChainApp() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [game, setGame] = useState<MafiaGame | null>(null);
  const [view, setView] = useState<View>('start');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerNickname, setPlayerNickname] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('center');

  useEffect(() => {
    const initApp = async () => {
      try {
        await sdk.actions.ready();
        setIsReady(true);
        const context = await sdk.context;

        // Handle case where context or user might be undefined
        if (context && context.user && context.user.username) {
          setUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName
          });
        } else {
          // Mock user for testing in development
          setUser({
            fid: 123456,
            username: 'testuser',
            displayName: 'Test User'
          });
        }
      } catch (error) {
        console.error('Failed to initialize Mini App:', error);
        // Fallback mock user for development
        setUser({
          fid: 123456,
          username: 'testuser',
          displayName: 'Test User'
        });
        setIsReady(true);
      }
    };

    initApp();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const connectWallet = async () => {
    try {
      // Placeholder for wallet connection - will be implemented based on actual SDK
      console.log('Wallet connection requested');
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const handleCreateGame = () => {
    setView('setup');
  };

  const handleJoinGame = () => {
    // For now, go to setup - later can add join game ID input
    setView('setup');
  };

  const handleSetupComplete = async (nickname: string, avatar: string) => {
    if (!user) return;

    setPlayerNickname(nickname);
    setPlayerAvatar(avatar);
    setLoading(true);

    try {
      await connectWallet();
      const gameId = `game-${Date.now()}`;
      const newGame = new MafiaGame(gameId, user.fid, nickname);
      setGame(newGame);
      setView('lobby');
    } catch (error) {
      console.error('Failed to create game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStart = () => {
    setView('start');
  };

  const startGame = () => {
    if (!game || !user) return;

    const gameState = game.getGameState();
    if (gameState.hostFid !== user.fid) return;

    if (gameState.players.length === 9) {
      game.startGame();
      setTimeLeft(5 * 60);
      setView('role');
    }
  };

  const acknowledgeRole = () => {
    if (!game || !user) return;

    game.acknowledgeRole(user.fid);
    setView('game');
  };

  const sendMessage = () => {
    if (!game || !user || !message.trim()) return;

    const userRole = game.getPlayerRole(user.fid);
    const gameState = game.getGameState();

    if (gameState.phase === 'night' && userRole === 'mafia') {
      game.addMessage(user.fid, message, true, 'mafia');
    } else if (gameState.phase === 'day') {
      game.addMessage(user.fid, message);
    }

    setMessage('');
  };

  const submitVote = () => {
    if (!game || !user || !selectedTarget) return;

    const gameState = game.getGameState();

    if (gameState.phase === 'day') {
      game.submitDayVote(user.fid, selectedTarget);
    } else if (gameState.phase === 'night') {
      const userRole = game.getPlayerRole(user.fid);
      if (userRole === 'mafia') {
        game.submitNightAction(user.fid, selectedTarget, 'kill');
      } else if (userRole === 'doctor') {
        game.submitNightAction(user.fid, selectedTarget, 'save');
      }
    }

    setSelectedTarget(null);
    setView('game');
  };

  const nextPhase = () => {
    if (!game) return;

    const gameState = game.getGameState();

    if (gameState.phase === 'day') {
      const { eliminated } = game.resolveDay();
      if (eliminated) {
        game.addMessage(0, `${gameState.players.find(p => p.fid === eliminated)?.username} was eliminated by vote!`);
      }
    } else if (gameState.phase === 'night') {
      const { killed, saved } = game.resolveNight();
      if (saved) {
        game.addMessage(0, `Someone was attacked but survived!`);
      } else if (killed) {
        game.addMessage(0, `${gameState.players.find(p => p.fid === killed)?.username} was killed in the night!`);
      }
    }

    const { winner, gameEnded } = game.checkWinCondition();

    if (gameEnded) {
      setView('results');
    } else {
      game.nextPhase();
      const newGameState = game.getGameState();
      setTimeLeft(newGameState.phase === 'day' ? 5 * 60 : 2.5 * 60);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-200">Loading MafiaChain...</p>
        </div>
      </div>
    );
  }

  const gameState = game?.getGameState();
  const userRole = game?.getPlayerRole(user?.fid || 0);
  const isUserAlive = game?.isPlayerAlive(user?.fid || 0);
  const alivePlayers = gameState?.players.filter(p => p.isAlive) || [];
  const messages = game?.getMessagesForPlayer(user?.fid || 0) || [];

  // Render based on current view
  if (view === 'start') {
    return (
      <StartScreen
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
      />
    );
  }

  if (view === 'setup') {
    return (
      <NameAndAvatarScreen
        onContinue={handleSetupComplete}
        onBack={handleBackToStart}
      />
    );
  }

  // Rest of the game views with the medieval theme
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-amber-900/20 to-gray-800 text-amber-100">
      <div className="max-w-md mx-auto">
        {/* Header with medieval styling */}
        <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/60 p-4 border-b border-amber-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-amber-200">🎭 MafiaChain</h1>
            {user && (
              <div className="flex items-center space-x-2">
                {playerAvatar && (
                  <div className="w-8 h-8 relative">
                    <Image
                      src={`/assets/Start Screen/Char ${playerAvatar.charAt(0).toUpperCase() + playerAvatar.slice(1)}.png`}
                      alt="Player Avatar"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span className="text-sm text-amber-200">{playerNickname || user.displayName || user.username}</span>
              </div>
            )}
          </div>

          {gameState && gameState.state === 'started' && (
            <div className="mt-2 flex justify-between text-sm text-amber-300">
              <span className="capitalize">{gameState.phase} Phase</span>
              <span>Round {gameState.round}/3</span>
              {timeLeft > 0 && <span className="text-amber-400 font-bold">{formatTime(timeLeft)}</span>}
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Lobby View */}
          {view === 'lobby' && gameState && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-amber-200">Village Gathering</h2>
                <button
                  onClick={() => setView('start')}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  ← Leave
                </button>
              </div>

              <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 rounded-lg p-4 border border-amber-600/30 backdrop-blur-sm">
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-amber-200">Villagers ({gameState.players.length}/9):</h3>
                  <div className="space-y-2">
                    {gameState.players.map((player, index) => (
                      <div key={player.fid} className="flex items-center justify-between bg-amber-900/30 rounded p-2 border border-amber-700/20">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 relative">
                            <Image
                              src="/assets/Start Screen/Char Center.png"
                              alt="Player"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="text-amber-100">{player.displayName || player.username}</span>
                        </div>
                        {player.isHost && <span className="text-yellow-400 text-sm">👑 Host</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {gameState.hostFid === user?.fid && gameState.players.length === 9 && (
                  <button
                    onClick={startGame}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-500 rounded-lg font-semibold text-white transition-all duration-200 border border-green-500/50"
                  >
                    {loading ? '⏳ Starting...' : '🚀 Begin the Gathering'}
                  </button>
                )}

                {gameState.players.length < 9 && (
                  <div className="text-center text-amber-300">
                    <p>Waiting for {9 - gameState.players.length} more villagers...</p>
                    <div className="mt-2 flex justify-center">
                      <div className="animate-pulse">🕯️</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Role Reveal View */}
          {view === 'role' && userRole && (
            <div className="space-y-6 text-center">
              <div className="bg-gradient-to-br from-amber-900/60 to-amber-800/40 rounded-lg p-6 border border-amber-600/50 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4 text-amber-200">Your Secret Role</h2>
                <div className="text-6xl mb-4">
                  {userRole === 'mafia' && '🔪'}
                  {userRole === 'doctor' && '💊'}
                  {userRole === 'god' && '👁️'}
                  {userRole === 'villager' && '👥'}
                </div>
                <h3 className="text-xl font-semibold capitalize mb-2 text-amber-100">{userRole}</h3>
                <p className="text-amber-300 text-sm">
                  {userRole === 'mafia' && `You are Mafia. Partner: ${game?.getMafiaPartner(user?.fid || 0)?.username || 'Unknown'}`}
                  {userRole === 'doctor' && 'You can save one player each night'}
                  {userRole === 'god' && 'You moderate the game and can see all'}
                  {userRole === 'villager' && 'Find and eliminate the Mafia'}
                </p>
              </div>

              <button
                onClick={acknowledgeRole}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-lg font-semibold text-white transition-all duration-200 border border-blue-500/50"
              >
                ✅ I Understand My Role
              </button>
            </div>
          )}

          {/* Game View */}
          {view === 'game' && gameState && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 rounded-lg p-4 border border-amber-600/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-amber-200">The Gathering</h2>
                  {isUserAlive && (
                    <span className="text-green-400 text-sm">✅ Alive</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                  <div className="bg-amber-900/40 rounded p-2 border border-amber-700/30">
                    <p className="text-amber-300">Phase</p>
                    <p className="font-semibold capitalize text-amber-100">{gameState.phase}</p>
                  </div>
                  <div className="bg-amber-900/40 rounded p-2 border border-amber-700/30">
                    <p className="text-amber-300">Round</p>
                    <p className="font-semibold text-amber-100">{gameState.round}/3</p>
                  </div>
                  <div className="bg-amber-900/40 rounded p-2 border border-amber-700/30">
                    <p className="text-amber-300">Time</p>
                    <p className="font-semibold text-amber-400">{formatTime(timeLeft)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-amber-200">Villagers ({alivePlayers.length} alive):</h3>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {gameState.players.map((player) => (
                      <div
                        key={player.fid}
                        className={`p-1 rounded text-center border ${
                          player.isAlive
                            ? 'bg-green-800/50 border-green-600/50 text-green-200'
                            : 'bg-red-800/50 border-red-600/50 text-red-200'
                        }`}
                      >
                        {player.username}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isUserAlive && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setView('chat')}
                    className="py-3 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-lg font-semibold text-white transition-all duration-200 border border-blue-500/50"
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => setView('vote')}
                    className="py-3 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-lg font-semibold text-white transition-all duration-200 border border-red-500/50"
                  >
                    🗳️ {gameState.phase === 'day' ? 'Vote' : 'Action'}
                  </button>
                </div>
              )}

              {user?.fid === gameState.hostFid && (
                <button
                  onClick={nextPhase}
                  className="w-full py-2 px-4 bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 rounded-lg font-semibold text-white text-sm transition-all duration-200 border border-yellow-500/50"
                >
                  ⏭️ Next Phase (Host)
                </button>
              )}
            </div>
          )}

          {/* Chat View */}
          {view === 'chat' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-amber-200">
                  {gameState?.phase === 'night' && userRole === 'mafia' ? '🔪 Mafia Council' : '💬 Village Square'}
                </h2>
                <button
                  onClick={() => setView('game')}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 rounded-lg p-4 h-64 overflow-y-auto border border-amber-600/30 backdrop-blur-sm">
                {messages.length === 0 ? (
                  <p className="text-amber-400 text-center">The village is quiet...</p>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="font-semibold text-amber-300">
                          {msg.fromFid === 0 ? 'Village Crier' : gameState?.players.find(p => p.fid === msg.fromFid)?.username}:
                        </span>
                        <span className="ml-2 text-amber-100">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUserAlive && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Speak to the village..."
                    className="flex-1 py-2 px-3 bg-amber-900/30 border border-amber-600/50 rounded-lg text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    className="py-2 px-4 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 rounded-lg text-white transition-all duration-200 border border-amber-500/50"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vote/Action View */}
          {view === 'vote' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-amber-200">
                  {gameState?.phase === 'day' ? '🗳️ Village Vote' :
                   userRole === 'mafia' ? '🔪 Choose Target' :
                   userRole === 'doctor' ? '💊 Save Someone' : '👁️ Watch'}
                </h2>
                <button
                  onClick={() => setView('game')}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="space-y-2">
                {alivePlayers
                  .filter(p => p.fid !== user?.fid)
                  .map((player) => (
                    <button
                      key={player.fid}
                      onClick={() => setSelectedTarget(player.fid)}
                      className={`w-full p-3 rounded-lg text-left transition-all duration-200 border ${
                        selectedTarget === player.fid
                          ? 'bg-amber-600/50 border-amber-400/70'
                          : 'bg-amber-900/30 border-amber-700/30 hover:bg-amber-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 relative">
                          <Image
                            src="/assets/Start Screen/Char Center.png"
                            alt="Player"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="text-amber-100">{player.displayName || player.username}</span>
                      </div>
                    </button>
                  ))}
              </div>

              {selectedTarget && (
                <button
                  onClick={submitVote}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-lg font-semibold text-white transition-all duration-200 border border-red-500/50"
                >
                  ✅ Confirm {gameState?.phase === 'day' ? 'Vote' : 'Action'}
                </button>
              )}
            </div>
          )}

          {/* Results View */}
          {view === 'results' && gameState && (
            <div className="space-y-6 text-center">
              <div className="bg-gradient-to-br from-amber-900/60 to-amber-800/40 rounded-lg p-6 border border-amber-600/50 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4 text-amber-200">The Tale Ends!</h2>
                <div className="text-4xl mb-4">
                  {(() => {
                    const { winner } = game?.checkWinCondition() || {};
                    return winner === 'mafia' ? '🔪' : '👥';
                  })()}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-amber-100">
                  {(() => {
                    const { winner } = game?.checkWinCondition() || {};
                    return winner === 'mafia' ? 'Mafia Victorious!' : 'Village Triumphant!';
                  })()}
                </h3>
                <p className="text-amber-300">
                  {(() => {
                    const { winner } = game?.checkWinCondition() || {};
                    const survivors = alivePlayers.length;
                    return winner === 'mafia'
                      ? 'The Mafia has taken control of the village!'
                      : `The villagers have vanquished all threats! ${survivors} survivors share the bounty.`;
                  })()}
                </p>
              </div>

              <button
                onClick={() => {
                  setGame(null);
                  setView('start');
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-lg font-semibold text-white transition-all duration-200 border border-blue-500/50"
              >
                🎮 Return to Village
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}