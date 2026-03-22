import { supabase } from '../index.js';

/**
 * Category model for quiz categories
 */
export class Category {
  /**
   * Get all active categories
   */
  static async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get category by ID
   */
  static async findById(categoryId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get user's mastery for all categories
   */
  static async getUserMastery(userId) {
    const { data, error } = await supabase
      .from('category_mastery')
      .select(`
        *,
        categories (name, emoji, color, description)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  /**
   * Get or create user's mastery for a category
   */
  static async getOrCreateMastery(userId, categoryId) {
    // Try to get existing mastery
    const { data: existing, error: fetchError } = await supabase
      .from('category_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .single();

    if (existing) return existing;

    // Create new mastery record if doesn't exist
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data, error } = await supabase
        .from('category_mastery')
        .insert({
          user_id: userId,
          category_id: categoryId,
          total_questions: 0,
          correct_answers: 0,
          mastery_level: 'Beginner',
          progress_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    throw fetchError;
  }
}

export default Category;
