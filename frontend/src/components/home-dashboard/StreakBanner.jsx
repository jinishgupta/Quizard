import StreakDisplay from '../StreakDisplay';
import { motion } from 'framer-motion';

export default function StreakBanner({ profile }) {
  const streakCount = profile?.currentStreak || 0;
  
  // Generate week history from streak count (simplified)
  const weekHistory = Array(7).fill(false).map((_, i) => i < Math.min(streakCount, 7));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
    >
      <StreakDisplay
        streakCount={streakCount}
        weekHistory={weekHistory}
      />
    </motion.div>
  );
}
