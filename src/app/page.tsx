'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LandingPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<number>(1); // 0=left, 1=center, 2=right
  const [nickname, setNickname] = useState<string>('');

  const handleAvatarSelect = (index: number) => {
    setSelectedAvatar(index);
  };

  const handleLetsgGo = () => {
    if (nickname.trim()) {
      // Navigate to the actual game or next screen
      window.location.href = '/miniapp';
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/avatars/Name and Avatar Screen background.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-12">
        {/* Avatar Selection */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {/* Left Avatar */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              selectedAvatar === 0 ? 'scale-110' : 'scale-90 opacity-70'
            }`}
            onClick={() => handleAvatarSelect(0)}
          >
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400">
              <Image
                src="/avatars/Avatar Left.png"
                alt="Left Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Center Avatar (Default Selected) */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              selectedAvatar === 1 ? 'scale-125' : 'scale-100 opacity-70'
            }`}
            onClick={() => handleAvatarSelect(1)}
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400">
              <Image
                src="/avatars/Avatar Center.png"
                alt="Center Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right Avatar */}
          <div
            className={`cursor-pointer transition-all duration-200 ${
              selectedAvatar === 2 ? 'scale-110' : 'scale-90 opacity-70'
            }`}
            onClick={() => handleAvatarSelect(2)}
          >
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-amber-400">
              <Image
                src="/avatars/Avatar Right.png"
                alt="Right Avatar"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Choose Your Avatar Text */}
        <div className="mb-8">
          <p className="text-white text-lg font-medium text-center">
            Choose your avatar
          </p>
        </div>

        {/* Nickname Input */}
        <div className="mb-8 w-full max-w-xs">
          <input
            type="text"
            placeholder="Enter Your Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 bg-white rounded-lg text-black placeholder-gray-500 text-center font-medium border-2 border-gray-200 focus:outline-none focus:border-amber-400"
            maxLength={20}
          />
        </div>

        {/* Let's Go Button */}
        <button
          onClick={handleLetsgGo}
          disabled={!nickname.trim()}
          className={`px-8 py-3 rounded-lg font-bold text-white text-lg transition-all duration-200 ${
            nickname.trim()
              ? 'bg-red-600 hover:bg-red-700 active:scale-95 cursor-pointer'
              : 'bg-gray-500 cursor-not-allowed opacity-50'
          }`}
        >
          Let&apos;s gooo!
        </button>

        {/* Stakes Info */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <p className="text-white text-sm font-medium">
            2LDEA5 0.01 ETH
          </p>
        </div>
      </div>
    </div>
  );
}