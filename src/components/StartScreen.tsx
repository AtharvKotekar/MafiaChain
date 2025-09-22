'use client';

import { useState } from 'react';
import Image from 'next/image';

interface StartScreenProps {
  onCreateGame: () => void;
  onJoinGame: () => void;
  userBalance?: string;
}

export default function StartScreen({ onCreateGame, onJoinGame, userBalance = "0.0045 ETH" }: StartScreenProps) {
  const [selectedCharacter, setSelectedCharacter] = useState('center');

  const characters = {
    left: '/assets/Start Screen/Char Left.png',
    center: '/assets/Start Screen/Char Center.png',
    right: '/assets/Start Screen/Char Right.png'
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/Start Screen/Start Screen Background Image.png"
          alt="Tavern Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Current Balance - Top */}
        <div className="absolute top-6 right-6">
          <div className="relative">
            <Image
              src="/assets/Start Screen/Current Balence Label.png"
              alt="Current Balance"
              width={150}
              height={40}
              className="object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {userBalance}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <Image
            src="/assets/Start Screen/Title.png"
            alt="MafiaChain Title"
            width={200}
            height={60}
            className="object-contain drop-shadow-2xl"
          />
        </div>

        {/* Character Selection */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          {/* Left Character */}
          <button
            onClick={() => setSelectedCharacter('left')}
            className={`transition-all duration-300 ${
              selectedCharacter === 'left' ? 'scale-110' : 'scale-90 opacity-70'
            }`}
          >
            <Image
              src={characters.left}
              alt="Left Character"
              width={80}
              height={80}
              className="object-contain drop-shadow-lg"
            />
          </button>

          {/* Center Character (Main) */}
          <button
            onClick={() => setSelectedCharacter('center')}
            className={`transition-all duration-300 ${
              selectedCharacter === 'center' ? 'scale-125' : 'scale-100 opacity-80'
            }`}
          >
            <Image
              src={characters.center}
              alt="Center Character"
              width={120}
              height={120}
              className="object-contain drop-shadow-xl"
            />
          </button>

          {/* Right Character */}
          <button
            onClick={() => setSelectedCharacter('right')}
            className={`transition-all duration-300 ${
              selectedCharacter === 'right' ? 'scale-110' : 'scale-90 opacity-70'
            }`}
          >
            <Image
              src={characters.right}
              alt="Right Character"
              width={80}
              height={80}
              className="object-contain drop-shadow-lg"
            />
          </button>
        </div>

        {/* Game Buttons */}
        <div className="flex flex-col space-y-4 w-full max-w-xs">
          {/* Create Game Button */}
          <button
            onClick={onCreateGame}
            className="relative group transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Image
              src="/assets/Start Screen/Create Game Button.png"
              alt="Create Game"
              width={200}
              height={50}
              className="object-contain drop-shadow-lg"
            />
            {/* Interactive overlay */}
            <div className="absolute inset-0 bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>

          {/* Join Game Button */}
          <button
            onClick={onJoinGame}
            className="relative group transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Image
              src="/assets/Start Screen/Join Game Button.png"
              alt="Join Game"
              width={200}
              height={50}
              className="object-contain drop-shadow-lg"
            />
            {/* Interactive overlay */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        </div>

        {/* Game Info */}
        <div className="mt-8 text-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-amber-600/30">
            <h3 className="text-amber-200 font-bold text-sm mb-2">🎲 Game Rules</h3>
            <div className="text-amber-100 text-xs space-y-1">
              <p>• 9 players: 2 Mafia, 1 Doctor, 1 God, 5 Villagers</p>
              <p>• Entry fee: 0.001 ETH • Prize pool shared</p>
              <p>• 3 rounds max • Day/Night phases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle particle effects could go here */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" />
        <div className="absolute top-32 right-20 w-1 h-1 bg-amber-300/40 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-pulse delay-2000" />
      </div>
    </div>
  );
}