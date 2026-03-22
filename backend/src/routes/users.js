import express from 'express';
import { User } from '../db/models/User.js';
import { Category } from '../db/models/Category.js';
import { supabase } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current user profile with statistics
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    console.log('\n=== GET USER PROFILE ===');
    const userId = req.user.id;
    console.log('User ID:', userId);

    // Get user profile with related data
    console.log('Fetching user profile...');
    const profile = await User.getProfile(userId);

    if (!profile) {
      console.log('❌ User profile not found');
      return res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User profile not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log('✅ Profile found:', profile.username);

    // Calculate overall accuracy
    const accuracy = profile.total_questions > 0
      ? ((profile.total_correct / profile.total_questions) * 100).toFixed(2)
      : 0;

    console.log('Profile stats - Rounds:', profile.total_rounds, 'Accuracy:', accuracy + '%');
    console.log('=== GET USER PROFILE SUCCESS ===\n');

    res.json({
      id: profile.id,
      orangeId: profile.orange_id,
      email: profile.email,
      username: profile.username,
      displayName: profile.display_name,
      bio: profile.bio,
      avatar: profile.avatar,
      banner: profile.banner,
      ethAddress: profile.eth_address,
      credits: profile.credits,
      currentStreak: profile.current_streak,
      bestStreak: profile.best_streak,
      lastPlayDate: profile.last_play_date,
      statistics: {
        totalRounds: profile.total_rounds,
        totalCorrect: profile.total_correct,
        totalQuestions: profile.total_questions,
        accuracy: parseFloat(accuracy),
      },
      categoryMastery: profile.category_mastery || [],
      badges: profile.user_badges || [],
      createdAt: profile.created_at,
    });
  } catch (error) {
    console.error('❌ GET USER PROFILE ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== GET USER PROFILE FAILED ===\n');
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve user profile',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, bio } = req.body;

    // Validate input
    if (displayName && displayName.length > 100) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_INVALID_FORMAT',
          message: 'Display name must be 100 characters or less',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: data.id,
      displayName: data.display_name,
      bio: data.bio,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to update user profile',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Return public user data
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      bio: user.bio,
      avatar: user.avatar,
      banner: user.banner,
      currentStreak: user.current_streak,
      bestStreak: user.best_streak,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Calculate accuracy
    const accuracy = user.total_questions > 0
      ? ((user.total_correct / user.total_questions) * 100).toFixed(2)
      : 0;

    res.json({
      userId: user.id,
      username: user.username,
      statistics: {
        totalRounds: user.total_rounds,
        totalCorrect: user.total_correct,
        totalQuestions: user.total_questions,
        accuracy: parseFloat(accuracy),
        currentStreak: user.current_streak,
        bestStreak: user.best_streak,
        lastPlayDate: user.last_play_date,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve user statistics',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/users/:id/badges
 * Get user badges (earned and unearned)
 */
router.get('/:id/badges', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    if (badgesError) throw badgesError;

    // Get user's earned badges
    const { data: earnedBadges, error: earnedError } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at')
      .eq('user_id', id);

    if (earnedError) throw earnedError;

    // Create a map of earned badges
    const earnedMap = new Map(earnedBadges.map(b => [b.badge_id, b.earned_at]));

    // Combine all badges with earned status
    const badges = allBadges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      emoji: badge.emoji,
      rarity: badge.rarity,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    }));

    res.json({
      userId: id,
      badges,
    });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve user badges',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/users/:id/mastery
 * Get category mastery levels for all categories
 */
router.get('/:id/mastery', authenticate, async (req, res) => {
  try {
    console.log('\n=== GET USER MASTERY ===');
    const { id } = req.params;
    console.log('User ID:', id);
    console.log('Authenticated user:', req.user?.id);

    // Get all active categories
    console.log('Fetching all categories...');
    const allCategories = await Category.getAll();
    console.log('Found categories:', allCategories.length);

    // Get user's mastery data
    console.log('Fetching user mastery data...');
    const userMastery = await Category.getUserMastery(id);
    console.log('Found mastery records:', userMastery.length);

    // Create a map of user's mastery by category ID
    const masteryMap = new Map(userMastery.map(m => [m.category_id, m]));

    // Combine all categories with mastery data
    const mastery = allCategories.map(category => {
      const userMasteryData = masteryMap.get(category.id);

      if (userMasteryData) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          emoji: category.emoji,
          color: category.color,
          totalQuestions: userMasteryData.total_questions,
          correctAnswers: userMasteryData.correct_answers,
          masteryLevel: userMasteryData.mastery_level,
          progressPercentage: userMasteryData.progress_percentage,
          lastPlayed: userMasteryData.last_played,
        };
      } else {
        // User hasn't played this category yet
        return {
          categoryId: category.id,
          categoryName: category.name,
          emoji: category.emoji,
          color: category.color,
          totalQuestions: 0,
          correctAnswers: 0,
          masteryLevel: 'Beginner',
          progressPercentage: 0,
          lastPlayed: null,
        };
      }
    });

    console.log('✅ Mastery data prepared successfully');
    console.log('=== GET USER MASTERY SUCCESS ===\n');

    res.json({
      userId: id,
      mastery,
    });
  } catch (error) {
    console.error('❌ GET USER MASTERY ERROR:', error);
    console.error('Error stack:', error.stack);
    console.log('=== GET USER MASTERY FAILED ===\n');
    res.status(500).json({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'Failed to retrieve user mastery',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
