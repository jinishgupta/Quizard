import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import PlayerRow from '../components/ui/PlayerRow';
import Card from '../components/ui/Card';
import { useLeaderboard, useLeagueRank, useCreditBalance, useUserProfile } from '../hooks/useApi';

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const TIER_CONFIG = {
  Bronze: { bg: '#92400E', text: '#FDE68A', border: '#B45309', emoji: '🥉' },
  Silver: { bg: '#374151', text: '#E5E7EB', border: '#6B7280', emoji: '🥈' },
  Gold: { bg: '#78350F', text: '#FDE68A', border: '#D97706', emoji: '🥇' },
  Platinum: { bg: '#1E3A5F', text: '#BAE6FD', border: '#0284C7', emoji: '💎' },
  Diamond: { bg: '#1E1B4B', text: '#C7D2FE', border: '#6366F1', emoji: '💠' },
};

const DEMOTION_ZONE = [9, 10];
const PROMOTION_ZONE = [1, 2, 3];

export default function Leagues() {
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const { data: rankResponse } = useLeagueRank();
  const rankData = rankResponse?.rank;
  const { data: creditData } = useCreditBalance();
  
  const [activeTier, setActiveTier] = useState(rankData?.tier || 'Gold');
  const { data: leaderboardData } = useLeaderboard(activeTier);
  
  const tierConfig = TIER_CONFIG[activeTier];
  const credits = creditData?.balance || 0;
  
  // Update active tier when rank data loads
  React.useEffect(() => {
    if (rankData?.tier) {
      setActiveTier(rankData.tier);
    }
  }, [rankData?.tier]);

  if (!rankData || !leaderboardData) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const myRank = rankData.rank || 0;
  const weeklyScore = rankData.weeklyScore || 0;
  const pointsToNext = rankData.pointsToNext || 0;
  const leaderboard = leaderboardData.leaderboard || [];

  return (
    <div className="min-h-screen bg-[#0A0F1A] grid-pattern">
      <Navbar credits={credits} notificationCount={3} />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pb-28 md:pb-10 pt-6 space-y-5">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card variant="brutal" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2"
                  style={{ background: tierConfig.bg, borderColor: tierConfig.border }}
                >
                  {tierConfig.emoji}
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Current League</p>
                  <h1
                    className="text-2xl font-black"
                    style={{ color: tierConfig.text }}
                  >
                    {activeTier} Division
                  </h1>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-[#9CA3AF] text-sm">
                  <Clock size={14} />
                  <span className="font-mono font-bold text-white">
                    {rankData.timeUntilReset || '6d 23h'}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-0.5">until reset</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card variant="outlined" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">My Rank</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">#{myRank}</span>
                  {rankData.rankChange && rankData.rankChange !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${rankData.rankChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {rankData.rankChange > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      <span>{Math.abs(rankData.rankChange)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#6B7280] mb-1">Weekly Score</p>
                <p className="text-2xl font-black font-mono text-[#60A5FA]">{weeklyScore.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B7280] mb-1">To Next Rank</p>
                <p className="text-lg font-black font-mono text-[#FCD34D]">+{pointsToNext}</p>
                <p className="text-[10px] text-[#6B7280]">pts needed</p>
              </div>
            </div>
            <div className="mt-4 bg-[#1F2937] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1D4ED8] transition-all duration-700"
                style={{ width: `${pointsToNext > 0 ? (weeklyScore / (weeklyScore + pointsToNext)) * 100 : 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#6B7280] mt-1 text-right font-mono">
              {weeklyScore} / {weeklyScore + pointsToNext}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {TIERS.map((tier) => {
            const tc = TIER_CONFIG[tier];
            const isActive = activeTier === tier;
            return (
              <button
                key={`tier-${tier}`}
                onClick={() => setActiveTier(tier)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-150"
                style={{
                  background: isActive ? tc.bg : 'transparent',
                  color: isActive ? tc.text : '#6B7280',
                  borderColor: isActive ? tc.border : '#374151',
                }}
              >
                <span>{tc.emoji}</span>
                {tier}
              </button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Leaderboard
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-[#6B7280]">
              <span className="flex items-center gap-1"><ArrowUp size={10} className="text-green-400" /> Promotion</span>
              <span className="flex items-center gap-1"><ArrowDown size={10} className="text-red-400" /> Demotion</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-green-500/20" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Promotion Zone</span>
              <div className="h-px flex-1 bg-green-500/20" />
            </div>

            {leaderboard.map((player, i) => {
              const isCurrentUser = player.userId === userProfile?.id;
              return (
                <React.Fragment key={`player-${player.rank}`}>
                  {player.rank === 4 && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-px flex-1 bg-[#374151]" />
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Safe Zone</span>
                      <div className="h-px flex-1 bg-[#374151]" />
                    </div>
                  )}
                  {player.rank === 9 && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-px flex-1 bg-red-500/20" />
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Demotion Zone</span>
                      <div className="h-px flex-1 bg-red-500/20" />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                  >
                    <PlayerRow
                      rank={player.rank}
                      name={player.username || player.displayName || 'Anonymous'}
                      avatar={player.avatar || '🧠'}
                      weeklyScore={player.weeklyScore}
                      accuracy={player.accuracy || 0}
                      isCurrentUser={isCurrentUser}
                      trend={player.trend || 'same'}
                    />
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <button
            onClick={() => navigate('/play-screen')}
            className="w-full py-4 rounded-xl bg-[#1D4ED8] text-white font-black text-base tracking-wide hover:bg-[#1E40AF] transition-colors duration-150 flex items-center justify-center gap-2 border-2 border-[#3B82F6]"
          >
            <TrendingUp size={18} />
            Play to Climb the Ranks
          </button>
        </motion.div>

      </main>

      <MobileBottomNav active="nav-leagues" />
    </div>
  );
}
