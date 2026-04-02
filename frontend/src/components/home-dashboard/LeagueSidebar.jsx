import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import LeagueTierBadge from '../LeagueTierBadge';
import { useLeagueRank, useLeaderboard, useRecentRounds } from '../../hooks/useApi';

export default function LeagueSidebar() {
  const { data: rankResponse, isLoading: rankLoading } = useLeagueRank();
  const rankData = rankResponse?.rank;
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard(rankData?.tier);
  const { data: recentRoundsData, isLoading: recentRoundsLoading } = useRecentRounds(3);
  const recentRounds = recentRoundsData?.history || [];

  const formatRecentDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (rankLoading) {
    return (
      <div className="space-y-4 sticky top-24">
        <div className="h-64 rounded-3xl animate-pulse" style={{ background: 'rgba(30,30,30,0.95)' }} />
      </div>
    );
  }

  const rank = rankData?.rank || 0;
  const tier = rankData?.tier || 'Bronze';
  const weeklyScore = rankData?.weeklyScore || 0;
  const totalPlayers = rankData?.totalPlayers || 0;
  const pointsToNextRank = rankData?.pointsToNextRank || 0;
  const accuracy = rankData?.accuracy || 0;
  
  const topPlayers = leaderboardData?.leaderboard?.slice(0, 6) || [];

  return (
    <div className="space-y-4 sticky top-24">
      <div
        className="p-5 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-primary-400" />
            <span className="text-sm font-bold text-white">Weekly League</span>
          </div>
          <span className="text-xs text-gray-500">Ends soon</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <LeagueTierBadge tier={tier} size="md" />
          <div className="text-right">
            <p className="text-2xl font-black text-white font-mono tabular-nums">
              #{rank}
            </p>
            <p className="text-xs text-gray-500">of {totalPlayers}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Weekly Score</span>
            <span className="text-xl font-black text-primary-400 font-mono tabular-nums">
              {weeklyScore.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(weeklyScore / (weeklyScore + pointsToNextRank)) * 100}%`,
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            <span className="text-primary-400 font-semibold">{pointsToNextRank} pts</span> to rank up
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <span className="text-xs text-gray-500 font-medium">Accuracy this week</span>
          <span className="text-sm font-bold text-white font-mono tabular-nums">{accuracy.toFixed(1)}%</span>
        </div>
      </div>

      <div
        className="p-5 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Recent Rounds <span className="text-xs text-gray-500 font-normal ml-1">last 3</span></h3>
        </div>
        <div className="space-y-4 pt-1">
          {recentRoundsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={`recent-skeleton-${i}`} className="h-10 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))
          ) : recentRounds.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">No recent rounds.</p>
          ) : (
            recentRounds.map((round) => (
              <div key={round.id} className="flex items-center justify-between group">
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors duration-150">
                    {round.categoryName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRecentDate(round.completedAt)} <span className="mx-0.5">·</span> {Math.round(round.accuracy)}% acc
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    {round.score}
                  </span>
                  {round.accuracy >= 80 ? (
                    <TrendingUp size={14} className="text-green-500" />
                  ) : round.accuracy >= 60 ? (
                    <Minus size={14} className="text-gray-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="p-5 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Leaderboard</h3>
          <Link 
            to="/leagues"
            className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-0.5 transition-colors duration-150"
          >
            Full <ChevronRight size={12} />
          </Link>
        </div>
        <div className="space-y-1.5">
          {leaderboardLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="h-12 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))
          ) : (
            topPlayers.map((player) => (
              <div
                key={player.userId}
                className={`flex items-center gap-2.5 p-2 rounded-2xl transition-all duration-150 ${
                  player.isCurrentUser
                    ? 'border border-primary-500/30' : 'hover:bg-white/3'
                }`}
                style={
                  player.isCurrentUser
                    ? { background: 'rgba(249,115,22,0.08)' }
                    : {}
                }
              >
                <span className="text-xs font-mono font-bold text-gray-500 w-5 text-center tabular-nums">
                  {player.rank}
                </span>
                <div
                  className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-black text-white shrink-0"
                >
                  {player.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${player.isCurrentUser ? 'text-primary-400' : 'text-white'}`}>
                    {player.isCurrentUser ? 'You' : player.username}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold tabular-nums text-gray-300">
                  {player.weeklyScore.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
