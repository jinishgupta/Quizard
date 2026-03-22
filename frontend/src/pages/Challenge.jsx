import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Swords, Shield, Users, Trophy, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useChallenge } from '../contexts/ChallengeContext';
import { get } from '../utils/api';

const TIER_COLORS = {
  Bronze: { bg: '#92400E', text: '#FDE68A', border: '#B45309' },
  Silver: { bg: '#374151', text: '#E5E7EB', border: '#6B7280' },
  Gold: { bg: '#78350F', text: '#FDE68A', border: '#D97706' },
  Platinum: { bg: '#1E3A5F', text: '#BAE6FD', border: '#0284C7' },
  Diamond: { bg: '#1E1B4B', text: '#C7D2FE', border: '#6366F1' },
};

const CREDIT_COST_SEND_CHALLENGE = 10;

export default function Challenge() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const { createChallenge, joinChallenge, isConnected, isAuthenticated, currentChallenge } = useChallenge();
  
  const [mode, setMode] = useState('list'); // 'list', 'create', 'accept'
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [creating, setCreating] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Check if there's a challenge ID in URL params
  const challengeIdParam = searchParams.get('id');

  // Fetch active challenges
  const { data: activeChallenges, refetch: refetchChallenges } = useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => get('/api/challenge/active'),
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => get('/api/game/categories'),
  });

  // Fetch user's credits
  const { data: creditsData } = useQuery({
    queryKey: ['credits'],
    queryFn: () => get('/api/credits/balance'),
    enabled: !!user,
  });

  // Fetch challenge details if ID is in URL
  const { data: challengeDetails } = useQuery({
    queryKey: ['challengeDetails', challengeIdParam],
    queryFn: () => get(`/api/challenge/${challengeIdParam}`),
    enabled: !!challengeIdParam && mode === 'accept',
  });

  useEffect(() => {
    if (challengeIdParam) {
      setMode('accept');
    }
  }, [challengeIdParam]);

  const handleCreateChallenge = async () => {
    if (!selectedOpponent || !selectedCategory) {
      toast.error('Please select an opponent and category');
      return;
    }

    if (!isConnected || !isAuthenticated) {
      toast.error('Not connected to server. Please wait...');
      return;
    }

    if (creditsData && creditsData.balance < CREDIT_COST_SEND_CHALLENGE) {
      toast.error(`Insufficient credits. Need ${CREDIT_COST_SEND_CHALLENGE} credits.`);
      return;
    }

    setCreating(true);
    try {
      createChallenge(selectedOpponent.id, selectedCategory.id, selectedDifficulty);
      toast.success('Challenge sent!');
      setTimeout(() => {
        navigate('/home-dashboard');
      }, 1500);
    } catch (error) {
      toast.error(error.message || 'Failed to create challenge');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptChallenge = async () => {
    if (!challengeIdParam) return;

    if (!isConnected || !isAuthenticated) {
      toast.error('Not connected to server. Please wait...');
      return;
    }

    setAccepting(true);
    try {
      joinChallenge(challengeIdParam);
      toast.success('Challenge accepted! Starting...');
      // Navigate to live challenge gameplay
      setTimeout(() => {
        navigate(`/challenge/play?id=${challengeIdParam}`);
      }, 1000);
    } catch (error) {
      toast.error(error.message || 'Failed to accept challenge');
    } finally {
      setAccepting(false);
    }
  };

  // Render create challenge mode
  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col">
        <Navbar credits={creditsData?.balance || 0} />

        <main className="flex-1 px-4 py-10 md:py-16">
          <div className="max-w-2xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 bg-[#1E3A5F] border border-[#1D4ED8] text-[#60A5FA] text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-widest">
                <Swords size={12} />
                Create Challenge
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                Challenge a Player
              </h1>
              <p className="text-[#6B7280] mt-2">
                Costs <span className="text-[#FCD34D] font-bold">{CREDIT_COST_SEND_CHALLENGE} credits</span> to send
              </p>
            </motion.div>

            {/* Select Category */}
            <Card variant="elevated" padding="md">
              <h3 className="text-sm font-bold text-white mb-3">Select Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCategory?.id === cat.id
                        ? 'bg-[#1D4ED8] border-[#3B82F6] text-white'
                        : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:border-[#4B5563]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-bold">{cat.name}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Select Difficulty */}
            <Card variant="elevated" padding="md">
              <h3 className="text-sm font-bold text-white mb-3">Select Difficulty</h3>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      selectedDifficulty === diff
                        ? 'bg-[#1D4ED8] border-[#3B82F6] text-white'
                        : 'bg-[#1F2937] border-[#374151] text-[#9CA3AF] hover:border-[#4B5563]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </Card>

            {/* Select Opponent - Placeholder */}
            <Card variant="elevated" padding="md">
              <h3 className="text-sm font-bold text-white mb-3">Select Opponent</h3>
              <p className="text-xs text-[#6B7280] mb-3">
                Feature coming soon: Select from friends or recent players
              </p>
              <input
                type="text"
                placeholder="Enter opponent user ID"
                onChange={(e) => setSelectedOpponent({ id: e.target.value })}
                className="w-full px-4 py-3 bg-[#1F2937] border border-[#374151] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
              />
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateChallenge}
                disabled={creating || !selectedOpponent || !selectedCategory}
                className={`w-full py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-3 border-2 ${
                  creating || !selectedOpponent || !selectedCategory
                    ? 'bg-[#374151] border-[#4B5563] text-[#6B7280] cursor-not-allowed'
                    : 'bg-[#1D4ED8] border-[#3B82F6] text-white hover:bg-[#1E40AF]'
                }`}
              >
                {creating ? (
                  <>Sending Challenge...</>
                ) : (
                  <>
                    <Swords size={18} />
                    Send Challenge
                    <span className="flex items-center gap-1 text-sm font-semibold opacity-80">
                      (–{CREDIT_COST_SEND_CHALLENGE} <span className="text-[#FCD34D]">⚡</span>)
                    </span>
                  </>
                )}
              </motion.button>

              <button
                onClick={() => setMode('list')}
                className="w-full py-3 rounded-xl border border-[#374151] text-[#6B7280] font-semibold text-sm hover:border-[#4B5563] hover:text-[#9CA3AF] transition-all duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    );
  }

  // Render accept challenge mode
  if (mode === 'accept' && challengeDetails) {
    const challenger = challengeDetails.challenger;
    const tierColors = TIER_COLORS[challenger.tier || 'Bronze'];

    return (
      <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col">
        <Navbar credits={creditsData?.balance || 0} />

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
                <span className="text-[#60A5FA]">{challenger.username}</span> challenges you
                <br />
                in {challengeDetails.category.emoji} {challengeDetails.category.name}
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
                  {challenger.avatar || '👤'}
                </div>
                <p className="text-sm font-black text-white">{challenger.username}</p>
              </Card>

              <div className="flex flex-col items-center gap-1">
                <div className="vs-pulse w-12 h-12 rounded-full bg-[#1D4ED8] border-2 border-[#3B82F6] flex items-center justify-center">
                  <span className="text-white font-black text-sm">VS</span>
                </div>
                <Swords size={16} className="text-[#374151]" />
              </div>

              <Card variant="default" padding="md" className="text-center border-dashed border-[#374151]">
                <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl bg-[#1F2937] border-2 border-dashed border-[#374151]">
                  {user?.avatar || '🧠'}
                </div>
                <p className="text-sm font-black text-white">You</p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card variant="elevated" padding="md">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">Category</p>
                    <p className="text-sm font-bold text-white">
                      {challengeDetails.category.emoji} {challengeDetails.category.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">Difficulty</p>
                    <p className="text-sm font-black capitalize text-[#FCD34D]">
                      {challengeDetails.difficulty}
                    </p>
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
              <motion.button
                whileHover={!accepting ? { scale: 1.02 } : {}}
                whileTap={!accepting ? { scale: 0.98 } : {}}
                onClick={handleAcceptChallenge}
                disabled={accepting || !isConnected}
                className={`w-full py-4 rounded-xl font-black text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-3 border-2 ${
                  accepting
                    ? 'bg-[#14532D] border-[#16A34A] text-[#4ADE80]'
                    : !isConnected
                    ? 'bg-[#374151] border-[#4B5563] text-[#6B7280] cursor-not-allowed'
                    : 'bg-[#1D4ED8] border-[#3B82F6] text-white hover:bg-[#1E40AF]'
                }`}
              >
                {accepting ? (
                  <>✓ Challenge Accepted — Loading...</>
                ) : !isConnected ? (
                  <>Connecting to server...</>
                ) : (
                  <>
                    <Swords size={18} />
                    Accept Challenge
                  </>
                )}
              </motion.button>

              <button
                onClick={() => navigate('/home-dashboard')}
                className="w-full py-3 rounded-xl border border-[#374151] text-[#6B7280] font-semibold text-sm hover:border-[#4B5563] hover:text-[#9CA3AF] transition-all duration-150"
              >
                Decline
              </button>

              {!isConnected && (
                <p className="text-center text-xs text-[#F87171]">
                  Waiting for connection to challenge server...
                </p>
              )}
            </motion.div>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    );
  }

  // Render list mode (default)
  return (
    <div className="min-h-screen bg-[#0A0F1A] diagonal-pattern flex flex-col">
      <Navbar credits={creditsData?.balance || 0} />

      <main className="flex-1 px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#1E3A5F] border border-[#1D4ED8] text-[#60A5FA] text-xs font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-widest">
              <Trophy size={12} />
              Challenges
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Player vs Player
            </h1>
            <p className="text-[#6B7280] mt-2">
              Challenge friends or accept incoming challenges
            </p>
          </motion.div>

          {/* Connection Status */}
          {!isConnected && (
            <Card variant="elevated" padding="md" className="border-[#F59E0B]">
              <div className="flex items-center gap-3">
                <Clock className="text-[#F59E0B]" size={20} />
                <p className="text-sm text-[#F59E0B]">
                  Connecting to challenge server...
                </p>
              </div>
            </Card>
          )}

          {/* Create Challenge Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('create')}
            className="w-full py-4 rounded-xl bg-[#1D4ED8] border-2 border-[#3B82F6] text-white font-black text-base tracking-wide hover:bg-[#1E40AF] transition-colors duration-150 flex items-center justify-center gap-2"
          >
            <Swords size={18} />
            Create New Challenge
            <span className="text-sm font-semibold opacity-80">
              (–{CREDIT_COST_SEND_CHALLENGE} <span className="text-[#FCD34D]">⚡</span>)
            </span>
          </motion.button>

          {/* Active Challenges */}
          <div>
            <h2 className="text-xl font-black text-white mb-4">Active Challenges</h2>
            {activeChallenges && activeChallenges.length > 0 ? (
              <div className="space-y-3">
                {activeChallenges.map((challenge) => (
                  <Card key={challenge.id} variant="elevated" padding="md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{challenge.category.emoji}</div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {challenge.challenger.id === user?.id
                              ? `vs ${challenge.opponent.username}`
                              : `vs ${challenge.challenger.username}`}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {challenge.category.name} • {challenge.difficulty}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            challenge.status === 'pending'
                              ? 'bg-[#78350F] text-[#FDE68A]'
                              : 'bg-[#14532D] text-[#4ADE80]'
                          }`}
                        >
                          {challenge.status}
                        </span>
                        {challenge.status === 'pending' && challenge.opponent.id === user?.id && (
                          <button
                            onClick={() => {
                              setMode('accept');
                              navigate(`/challenge?id=${challenge.id}`);
                            }}
                            className="px-3 py-1 bg-[#1D4ED8] text-white text-xs font-bold rounded-lg hover:bg-[#1E40AF]"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card variant="default" padding="md" className="text-center">
                <Users className="mx-auto mb-2 text-[#6B7280]" size={32} />
                <p className="text-sm text-[#6B7280]">No active challenges</p>
              </Card>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
