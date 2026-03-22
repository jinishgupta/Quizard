import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Star, ChevronRight, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import Card from '../components/ui/Card';

const CATEGORIES = [
  {
    id: 'sci-tech',
    name: 'Science & Tech',
    emoji: '🔬',
    description: 'Physics, chemistry, biology, and cutting-edge technology',
    masteryLevel: 'Expert',
    masteryProgress: 82,
    masteryColor: '#1D4ED8',
    premium: false,
    questionsPlayed: 240,
    featured: true,
  },
  {
    id: 'space',
    name: 'Space & Cosmos',
    emoji: '🚀',
    description: 'Astronomy, space exploration, and the universe',
    masteryLevel: 'Expert',
    masteryProgress: 78,
    masteryColor: '#7C3AED',
    premium: false,
    questionsPlayed: 185,
  },
  {
    id: 'code',
    name: 'Code & Dev',
    emoji: '💻',
    description: 'Programming languages, algorithms, and software',
    masteryLevel: 'Adept',
    masteryProgress: 65,
    masteryColor: '#0891B2',
    premium: false,
    questionsPlayed: 142,
  },
  {
    id: 'history',
    name: 'World History',
    emoji: '🏛️',
    description: 'Ancient civilizations to modern world events',
    masteryLevel: 'Adept',
    masteryProgress: 58,
    masteryColor: '#D97706',
    premium: false,
    questionsPlayed: 98,
  },
  {
    id: 'culture',
    name: 'Pop Culture',
    emoji: '🎬',
    description: 'Movies, TV, celebrities, and viral moments',
    masteryLevel: 'Novice',
    masteryProgress: 42,
    masteryColor: '#DC2626',
    premium: false,
    questionsPlayed: 67,
  },
  {
    id: 'geo',
    name: 'Geography',
    emoji: '🌍',
    description: 'Countries, capitals, landmarks, and maps',
    masteryLevel: 'Novice',
    masteryProgress: 35,
    masteryColor: '#16A34A',
    premium: false,
    questionsPlayed: 54,
  },
  {
    id: 'music',
    name: 'Music & Arts',
    emoji: '🎵',
    description: 'Music theory, artists, genres, and art history',
    masteryLevel: 'Beginner',
    masteryProgress: 22,
    masteryColor: '#9333EA',
    premium: true,
    questionsPlayed: 18,
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    description: 'Football, basketball, Olympics, and sports trivia',
    masteryLevel: 'Beginner',
    masteryProgress: 18,
    masteryColor: '#EA580C',
    premium: true,
    questionsPlayed: 12,
  },
  {
    id: 'custom',
    name: 'Custom Quiz',
    emoji: '✨',
    description: 'AI-generated quiz on any topic you choose',
    masteryLevel: '—',
    masteryProgress: 0,
    masteryColor: '#1D4ED8',
    premium: true,
    questionsPlayed: 0,
  },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const DIFFICULTY_CONFIG = {
  Easy: { color: '#4ADE80', bg: '#14532D', border: '#16A34A', desc: '30s per Q' },
  Medium: { color: '#FCD34D', bg: '#451A03', border: '#D97706', desc: '20s per Q' },
  Hard: { color: '#F87171', bg: '#450A0A', border: '#DC2626', desc: '12s per Q' },
};

export default function Categories() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');

  const featuredCategory = CATEGORIES.find((c) => c.featured);
  const otherCategories = CATEGORIES.filter((c) => !c.featured);

  const handleCategoryClick = (cat) => {
    if (cat.premium) return;
    setSelectedCategory(cat);
  };

  const handlePlay = () => {
    if (!selectedCategory) return;
    navigate('/play-screen');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] dot-pattern">
      <Navbar credits={247} notificationCount={3} />

      <main className="max-w-4xl mx-auto px-4 md:px-6 pb-28 md:pb-10 pt-6 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-black text-white">Choose Your Arena</h1>
          <p className="text-[#9CA3AF] mt-1 text-sm">Pick a category and prove your knowledge</p>
        </motion.div>

        {/* Featured Category */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-[#FCD34D]" />
            <span className="text-xs font-bold text-[#FCD34D] uppercase tracking-wider">Featured</span>
          </div>
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => handleCategoryClick(featuredCategory)}
            className={`relative overflow-hidden rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${
              selectedCategory?.id === featuredCategory.id
                ? 'border-[#1D4ED8] bg-[#1E3A5F]'
                : 'border-[#374151] bg-[#111827] hover:border-[#1D4ED8]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">{featuredCategory.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-white">{featuredCategory.name}</h2>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${featuredCategory.masteryColor}22`,
                      color: featuredCategory.masteryColor,
                      border: `1px solid ${featuredCategory.masteryColor}44`,
                    }}
                  >
                    {featuredCategory.masteryLevel}
                  </span>
                </div>
                <p className="text-sm text-[#9CA3AF] mb-3">{featuredCategory.description}</p>
                <div className="mastery-bar mb-1">
                  <div
                    className="mastery-bar-fill"
                    style={{ width: `${featuredCategory.masteryProgress}%`, background: featuredCategory.masteryColor }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#6B7280] font-mono">{featuredCategory.masteryProgress}% mastery</p>
                  <p className="text-[10px] text-[#6B7280]">{featuredCategory.questionsPlayed} played</p>
                </div>
              </div>
            </div>
            {selectedCategory?.id === featuredCategory.id && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#1D4ED8] flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Category Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">All Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {otherCategories.map((cat, i) => {
              const isSelected = selectedCategory?.id === cat.id;
              const isCustom = cat.id === 'custom';

              return (
                <motion.div
                  key={`cat-${cat.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  whileHover={!cat.premium ? { scale: 1.02 } : {}}
                  onClick={() => handleCategoryClick(cat)}
                  className={`relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-200 ${
                    isCustom
                      ? 'border-dashed border-[#1D4ED8] bg-[#0D1829] cursor-pointer hover:bg-[#1E3A5F]'
                      : cat.premium
                      ? 'border-[#1F2937] bg-[#0D1117] cursor-not-allowed'
                      : isSelected
                      ? 'border-[#1D4ED8] bg-[#1E3A5F] cursor-pointer'
                      : 'border-[#1F2937] bg-[#111827] cursor-pointer hover:border-[#374151]'
                  }`}
                >
                  {cat.premium && !isCustom && (
                    <div className="absolute inset-0 bg-[#0A0F1A]/70 rounded-xl flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-1">
                        <Lock size={18} className="text-[#4B5563]" />
                        <span className="text-[10px] font-bold text-[#4B5563]">Premium</span>
                      </div>
                    </div>
                  )}

                  {isCustom && (
                    <div className="absolute top-2 right-2">
                      <Sparkles size={12} className="text-[#60A5FA]" />
                    </div>
                  )}

                  <div className="text-3xl mb-2">{cat.emoji}</div>
                  <p className={`text-sm font-bold mb-1 ${cat.premium && !isCustom ? 'text-[#4B5563]' : 'text-white'}`}>
                    {cat.name}
                  </p>

                  {!isCustom && (
                    <>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-2 inline-block"
                        style={{
                          background: cat.premium ? '#1F2937' : `${cat.masteryColor}22`,
                          color: cat.premium ? '#4B5563' : cat.masteryColor,
                          border: `1px solid ${cat.premium ? '#374151' : cat.masteryColor + '44'}`,
                        }}
                      >
                        {cat.masteryLevel}
                      </span>
                      <div className="mastery-bar mt-1">
                        <div
                          className="mastery-bar-fill"
                          style={{
                            width: `${cat.masteryProgress}%`,
                            background: cat.premium ? '#374151' : cat.masteryColor,
                          }}
                        />
                      </div>
                    </>
                  )}

                  {isCustom && (
                    <p className="text-[10px] text-[#60A5FA] mt-1">AI-powered · Any topic</p>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1D4ED8] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Difficulty Selector + Play CTA */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="sticky bottom-20 md:bottom-6 z-30"
            >
              <Card variant="brutal" padding="md" className="bg-[#0A0F1A]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedCategory.emoji}</span>
                    <div>
                      <p className="text-xs text-[#6B7280]">Selected</p>
                      <p className="text-sm font-bold text-white">{selectedCategory.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[#6B7280] hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-[#6B7280] font-semibold mb-2 uppercase tracking-wider">Difficulty</p>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((diff) => {
                      const dc = DIFFICULTY_CONFIG[diff];
                      const isActive = selectedDifficulty === diff;
                      return (
                        <button
                          key={`diff-${diff}`}
                          onClick={() => setSelectedDifficulty(diff)}
                          className="flex-1 py-2 rounded-lg border text-xs font-bold transition-all duration-150"
                          style={{
                            background: isActive ? dc.bg : 'transparent',
                            color: isActive ? dc.color : '#6B7280',
                            borderColor: isActive ? dc.border : '#374151',
                          }}
                        >
                          {diff}
                          <span className="block text-[9px] font-normal opacity-70 mt-0.5">{dc.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handlePlay}
                  className="w-full py-3.5 rounded-xl bg-[#1D4ED8] border-2 border-[#3B82F6] text-white font-black text-sm tracking-wide hover:bg-[#1E40AF] transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  Start {selectedDifficulty} Quiz
                  <ChevronRight size={16} />
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      <MobileBottomNav active="nav-cats" />
    </div>
  );
}
