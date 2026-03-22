import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Swords, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import Card from '../components/ui/Card';

const CHALLENGE_DATA = {
  challenger: {
    name: 'NovaMind',
    avatar: '🦅',
    playerId: 'TL-1042',
    score: 9,
    total: 10,
    accuracy: 94,
    tier: 'Diamond',
  },
  category: 'Science & Tech',
  categoryEmoji: '🔬',
  creditCost: 5,
  expiresIn: '23h 14m',
};

const TIER_COLORS = {
  Bronze: { bg: '#92400E', text: '#FDE68A', border: '#B45309' },
  Silver: { bg: '#374151', text: '#E5E7EB', border: '#6B7280' },
  Gold: { bg: '#78350F', text: '#FDE68A', border: '#D97706' },
  Platinum: { bg: '#1E3A5F', text: '#BAE6FD', border: '#0284C7' },
  Diamond: { bg: '#1E1B4B', text: '#C7D2FE', border: '#6366F1' },
};

export default function Challenge() {
  const navigate = useNavigate();
  const [isLoggedIn] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const { challenger, category, categoryEmoji, creditCost, expiresIn } = CHALLENGE_DATA;
  const tierColors = TIER_COLORS[challenger.tier];

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      navigate('/play-screen');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col">
      <Navbar credits={247} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-lg space-y-6">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#1E3A5F] border border-[#1D4ED8] text-[#60A5FA] text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              <Swords size={12} />
              Challenge Incoming
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
              <span className="text-[#60A5FA]">{challenger.name}</span> challenges you
              <br />
              to beat{' '}
              <span className="text-[#FCD34D] font-mono">{challenger.score}/{challenger.total}</span>
              <br />
              in {categoryEmoji} {category}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center"
          >
            <Card variant="brutal" padding="md" className="text-center">
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl border-2"
                style={{ background: tierColors.bg, borderColor: tierColors.border }}
              >
                {challenger.avatar}
              </div>
              <p className="text-sm font-black text-white">{challenger.name}</p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block"
                style={{ background: tierColors.bg, color: tierColors.text, borderColor: tierColors.border }}
              >
                {challenger.tier}
              </span>
              <div className="mt-3 bg-[#1F2937] rounded-lg p-2">
                <p className="text-2xl font-black font-mono text-[#FCD34D]">
                  {challenger.score}/{challenger.total}
                </p>
                <p className="text-[10px] text-[#6B7280]">{challenger.accuracy}% accuracy</p>
              </div>
            </Card>

            <div className="flex flex-col items-center gap-1">
              <div className="vs-pulse w-12 h-12 rounded-full bg-[#1D4ED8] border-2 border-[#3B82F6] flex items-center justify-center">
                <span className="text-white font-black text-sm">VS</span>
              </div>
              <Swords size={16} className="text-[#374151]" />
            </div>

            <Card variant="default" padding="md" className="text-center border-dashed border-[#374151]">
              <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl bg-[#1F2937] border-2 border-dashed border-[#374151]">
                🧠
              </div>
              <p className="text-sm font-black text-white">You</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block bg-[#78350F] text-[#FDE68A] border-[#D97706]">
                Gold
              </span>
              <div className="mt-3 bg-[#1F2937] rounded-lg p-2">
                <p className="text-2xl font-black font-mono text-[#6B7280]">?/?</p>
                <p className="text-[10px] text-[#6B7280]">your score</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card variant="elevated" padding="md">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Category</p>
                  <p className="text-sm font-bold text-white">{categoryEmoji} {category}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Target Score</p>
                  <p className="text-sm font-black font-mono text-[#FCD34D]">{challenger.score}/{challenger.total}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] mb-1">Expires In</p>
                  <p className="text-sm font-bold font-mono text-[#F87171]">{expiresIn}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="space-y-3"
          >
            {isLoggedIn ? (
              <>
                <motion.button
                  whileHover={!accepted ? { scale: 1.02 } : {}}
                  whileTap={!accepted ? { scale: 0.98 } : {}}
                  onClick={handleAccept}
                  disabled={accepted}
                  className={`w-full py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-3 border-2 ${
                    accepted
                      ? 'bg-[#14532D] border-[#16A34A] text-[#4ADE80]'
                      : 'bg-[#1D4ED8] border-[#3B82F6] text-white hover:bg-[#1E40AF]'
                  }`}
                >
                  {accepted ? (
                    <>✓ Challenge Accepted — Loading...</>
                  ) : (
                    <>
                      <Swords size={18} />
                      Accept Challenge
                      <span className="flex items-center gap-1 text-sm font-semibold opacity-80">
                        (–{creditCost} <span className="text-[#FCD34D]">⚡</span>)
                      </span>
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-3 rounded-xl border border-[#374151] text-[#6B7280] font-semibold text-sm hover:border-[#4B5563] hover:text-[#9CA3AF] transition-all duration-150"
                >
                  Decline
                </button>

                <p className="text-center text-xs text-[#4B5563]">
                  Accepting costs <span className="text-[#FCD34D] font-bold">{creditCost} credits</span>. Win to earn them back + bonus.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-4 rounded-xl bg-[#1D4ED8] border-2 border-[#3B82F6] text-white font-black text-base tracking-wide hover:bg-[#1E40AF] transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <Shield size={18} />
                  Sign In to Accept
                </button>
                <p className="text-center text-xs text-[#4B5563]">
                  Create a free account to compete in challenges
                </p>
              </>
            )}
          </motion.div>

        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
