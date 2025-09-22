'use client';

import { useState } from 'react';
import Image from 'next/image';

interface NameAndAvatarScreenProps {
  onContinue: (nickname: string, avatar: string) => void;
  onBack: () => void;
  stakes?: string;
}

export default function NameAndAvatarScreen({
  onContinue,
  onBack,
  stakes = "0.001 ETH"
}: NameAndAvatarScreenProps) {
  const [selectedAvatar, setSelectedAvatar] = useState('center');
  const [nickname, setNickname] = useState('');

  const avatars = {
    left: '/assets/Name and Avatar Screen/Avatar Left.png',
    center: '/assets/Name and Avatar Screen/Avatar Center.png',
    right: '/assets/Name and Avatar Screen/Avatar Right.png'
  };

  const handleContinue = () => {
    if (nickname.trim()) {
      onContinue(nickname.trim(), selectedAvatar);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/Name and Avatar Screen/Name and Avatar Screen background.png"
          alt="Village Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm rounded-full p-3 border border-amber-600/50 hover:bg-black/70 transition-all duration-200"
        >
          <span className="text-amber-200 text-xl">←</span>
        </button>

        {/* Stakes Display */}
        <div className="absolute top-6 right-6">
          <div className="relative">
            <Image
              src="/assets/Name and Avatar Screen/Stakes Label.png"
              alt="Stakes"
              width={120}
              height={35}
              className="object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {stakes}
              </span>
            </div>
          </div>
        </div>

        {/* Choose Avatar Label */}
        <div className="mb-8">
          <Image
            src="/assets/Name and Avatar Screen/Choose Your Avatar Label.png"
            alt="Choose Your Avatar"
            width={250}
            height={40}
            className="object-contain drop-shadow-lg"
          />
        </div>

        {/* Avatar Selection */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          {/* Left Avatar */}
          <button
            onClick={() => setSelectedAvatar('left')}
            className={`relative transition-all duration-300 ${
              selectedAvatar === 'left'
                ? 'scale-110 ring-4 ring-amber-400/60 rounded-full'
                : 'scale-90 opacity-70 hover:scale-95 hover:opacity-90'
            }`}
          >
            <Image
              src={avatars.left}
              alt="Left Avatar"
              width={100}
              height={100}
              className="object-contain drop-shadow-xl"
            />
            {selectedAvatar === 'left' && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
            )}
          </button>

          {/* Center Avatar (Default) */}
          <button
            onClick={() => setSelectedAvatar('center')}
            className={`relative transition-all duration-300 ${
              selectedAvatar === 'center'
                ? 'scale-125 ring-4 ring-amber-400/60 rounded-full'
                : 'scale-100 opacity-80 hover:scale-105 hover:opacity-95'
            }`}
          >
            <Image
              src={avatars.center}
              alt="Center Avatar"
              width={120}
              height={120}
              className="object-contain drop-shadow-2xl"
            />
            {selectedAvatar === 'center' && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
              </div>
            )}
          </button>

          {/* Right Avatar */}
          <button
            onClick={() => setSelectedAvatar('right')}
            className={`relative transition-all duration-300 ${
              selectedAvatar === 'right'
                ? 'scale-110 ring-4 ring-amber-400/60 rounded-full'
                : 'scale-90 opacity-70 hover:scale-95 hover:opacity-90'
            }`}
          >
            <Image
              src={avatars.right}
              alt="Right Avatar"
              width={100}
              height={100}
              className="object-contain drop-shadow-xl"
            />
            {selectedAvatar === 'right' && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
            )}
          </button>
        </div>

        {/* Nickname Input */}
        <div className="relative mb-8 w-full max-w-sm">
          <div className="relative">
            <Image
              src="/assets/Name and Avatar Screen/Nickname TextField.png"
              alt="Nickname Field"
              width={280}
              height={50}
              className="object-contain"
            />
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={15}
              className="absolute inset-0 bg-transparent text-center text-white font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 rounded-lg px-4"
            />
          </div>
          {nickname.length > 0 && (
            <div className="text-amber-200 text-xs text-center mt-1">
              {nickname.length}/15 characters
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!nickname.trim()}
          className={`relative group transition-all duration-200 ${
            nickname.trim()
              ? 'hover:scale-105 active:scale-95 cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <Image
            src="/assets/Name and Avatar Screen/Let's go Button.png"
            alt="Let's Go"
            width={180}
            height={50}
            className="object-contain drop-shadow-lg"
          />
          {nickname.trim() && (
            <div className="absolute inset-0 bg-green-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          )}
        </button>

        {/* Character Preview */}
        <div className="mt-6 text-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-amber-600/30">
            <h3 className="text-amber-200 font-bold text-sm mb-2">Your Character</h3>
            <div className="text-amber-100 text-xs">
              <p><span className="text-amber-300">Nickname:</span> {nickname || "Not set"}</p>
              <p><span className="text-amber-300">Avatar:</span> {selectedAvatar.charAt(0).toUpperCase() + selectedAvatar.slice(1)}</p>
              <p><span className="text-amber-300">Entry Fee:</span> {stakes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Fireflies/magical particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400/60 rounded-full animate-pulse delay-500" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-amber-300/40 rounded-full animate-pulse delay-1500" />
        <div className="absolute bottom-1/3 left-1/5 w-1 h-1 bg-amber-500/50 rounded-full animate-pulse delay-2500" />
        <div className="absolute top-2/3 right-1/4 w-0.5 h-0.5 bg-yellow-400/70 rounded-full animate-pulse delay-3000" />
      </div>
    </div>
  );
}