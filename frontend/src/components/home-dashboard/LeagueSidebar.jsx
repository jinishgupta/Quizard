import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import LeagueTierBadge from '../LeagueTierBadge';

const LEAGUE_DATA = {
  tier: 'Gold',
  rank: 7,
  totalPlayers: 50,
  weeklyScore: 1840,
  pointsToNextRank: 95,
  weekEndsIn: '2d 14h',
  accuracy: 74.2,
};

const RECENT_ROUNDS = [
  { id: 'round-r1', category: 'Tech & AI', score: 840, accuracy: 90, date: 'Today', trend: 'up' },
  { id: 'round-r2', category: 'Science', score: 620, accuracy: 70, date: 'Yesterday', trend: 'neutral' },
  { id: 'round-r3', category: 'History', score: 380, accuracy: 50, date: 'Mar 19', trend: 'down' },
];

const TOP_PLAYERS = [
  { id: 'player-p1', name: 'Zara Okonkwo', score: 3240, accuracy: 91, rank: 1, avatar: 'Z', color: 'bg-yellow-500' },
  { id: 'player-p2', name: 'Mateus Ferreira', score: 2980, accuracy: 88, rank: 2, avatar: 'M', color: 'bg-blue-500' },
  { id: 'player-p3', name: 'Soo-Jin Park', score: 2755, accuracy: 85, rank: 3, avatar: 'S', color: 'bg-green-500' },
  { id: 'player-p4', name: 'Ravi Krishnan', score: 2630, accuracy: 82, rank: 4, avatar: 'R', color: 'bg-purple-500' },
  { id: 'player-p5', name: 'Amara Diallo', score: 2510, accuracy: 79, rank: 5, avatar: 'A', color: 'bg-pink-500' },
  { id: 'player-you', name: 'You', score: 1840, accuracy: 74, rank: 7, avatar: 'Y', color: 'bg-primary-500', isYou: true },
];

export default function LeagueSidebar() {
  return (
    <div className="space-y-4 sticky top-24">
      <div
        className="p-5 rounded-card"
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
          <span className="text-xs text-gray-500">Ends in {LEAGUE_DATA.weekEndsIn}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <LeagueTierBadge tier={LEAGUE_DATA.tier} size="md" />
          <div className="text-right">
            <p className="text-2xl font-black text-white font-mono tabular-nums">
              #{LEAGUE_DATA.rank}
            </p>
            <p className="text-xs text-gray-500">of {LEAGUE_DATA.totalPlayers}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Weekly Score</span>
            <span className="text-xl font-black text-primary-400 font-mono tabular-nums">
              {LEAGUE_DATA.weeklyScore.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(LEAGUE_DATA.weeklyScore / (LEAGUE_DATA.weeklyScore + LEAGUE_DATA.pointsToNextRank)) * 100}%`,
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            <span className="text-primary-400 font-semibold">{LEAGUE_DATA.pointsToNextRank} pts</span> to rank up
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <span className="text-xs text-gray-500 font-medium">Accuracy this week</span>
          <span className="text-sm font-bold text-white font-mono tabular-nums">{LEAGUE_DATA.accuracy}%</span>
        </div>
      </div>

      <div
        className="p-5 rounded-card"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span>Recent Rounds</span>
          <span className="text-gray-600 font-normal text-xs">last 3</span>
        </h3>
        <div className="space-y-2">
          {RECENT_ROUNDS.map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between p-2.5 rounded-lg transition-colors duration-150 hover:bg-white/3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{round.category}</p>
                <p className="text-xs text-gray-500">{round.date} · {round.accuracy}% acc</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono tabular-nums text-white">{round.score}</span>
                {round.trend === 'up' && <TrendingUp size={14} className="text-green-400" />}
                {round.trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
                {round.trend === 'neutral' && <Minus size={14} className="text-gray-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-card"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Leaderboard</h3>
          <button className="text-xs text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-0.5 transition-colors duration-150">
            Full <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-1.5">
          {TOP_PLAYERS.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-2.5 p-2 rounded-lg transition-all duration-150 ${
                player.isYou
                  ? 'border border-primary-500/30' : 'hover:bg-white/3'
              }`}
              style={
                player.isYou
                  ? { background: 'rgba(249,115,22,0.08)' }
                  : {}
              }
            >
              <span className="text-xs font-mono font-bold text-gray-500 w-5 text-center tabular-nums">
                {player.rank}
              </span>
              <div
                className={`w-7 h-7 rounded-full ${player.color} flex items-center justify-center text-xs font-black text-white shrink-0`}
              >
                {player.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${player.isYou ? 'text-primary-400' : 'text-white'}`}>
                  {player.name}
                </p>
              </div>
              <span className="text-xs font-mono font-bold tabular-nums text-gray-300">
                {player.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
