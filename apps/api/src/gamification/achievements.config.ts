export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'capture' | 'review' | 'streak' | 'network' | 'special';
  requirement: {
    type: 'capture_count' | 'review_count' | 'streak_days' | 'link_count' | 'recall_rate' | 'perfect_week';
    value: number;
  };
  reward?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Capture achievements
  {
    id: 'first_memory',
    name: 'First Memory',
    description: 'Capture your first memory',
    icon: '🎯',
    category: 'capture',
    requirement: { type: 'capture_count', value: 1 },
  },
  {
    id: 'memory_collector',
    name: 'Memory Collector',
    description: 'Capture 10 memories',
    icon: '📝',
    category: 'capture',
    requirement: { type: 'capture_count', value: 10 },
  },
  {
    id: 'memory_master',
    name: 'Memory Master',
    description: 'Capture 100 memories',
    icon: '📚',
    category: 'capture',
    requirement: { type: 'capture_count', value: 100 },
  },
  {
    id: 'memory_legend',
    name: 'Memory Legend',
    description: 'Capture 1000 memories',
    icon: '🏆',
    category: 'capture',
    requirement: { type: 'capture_count', value: 1000 },
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day capture streak',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak_days', value: 3 },
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day capture streak',
    icon: '⚡',
    category: 'streak',
    requirement: { type: 'streak_days', value: 7 },
    reward: 'Unlock gradient themes',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day capture streak',
    icon: '💎',
    category: 'streak',
    requirement: { type: 'streak_days', value: 30 },
    reward: 'Unlock OLED dark mode',
  },
  {
    id: 'streak_100',
    name: 'Centurion',
    description: 'Maintain a 100-day capture streak',
    icon: '👑',
    category: 'streak',
    requirement: { type: 'streak_days', value: 100 },
    reward: 'Premium features unlock',
  },

  // Review achievements
  {
    id: 'first_review',
    name: 'First Review',
    description: 'Complete your first SRS review',
    icon: '🎓',
    category: 'review',
    requirement: { type: 'review_count', value: 1 },
  },
  {
    id: 'review_scholar',
    name: 'Review Scholar',
    description: 'Complete 50 SRS reviews',
    icon: '📖',
    category: 'review',
    requirement: { type: 'review_count', value: 50 },
  },
  {
    id: 'review_master',
    name: 'Review Master',
    description: 'Complete 500 SRS reviews',
    icon: '🧠',
    category: 'review',
    requirement: { type: 'review_count', value: 500 },
  },
  {
    id: 'perfect_recall',
    name: 'Perfect Recall',
    description: 'Achieve 90% recall success rate',
    icon: '💯',
    category: 'review',
    requirement: { type: 'recall_rate', value: 90 },
  },

  // Network achievements
  {
    id: 'connector',
    name: 'Connector',
    description: 'Create 10 memory links',
    icon: '🔗',
    category: 'network',
    requirement: { type: 'link_count', value: 10 },
  },
  {
    id: 'network_builder',
    name: 'Network Builder',
    description: 'Create 50 memory links',
    icon: '🕸️',
    category: 'network',
    requirement: { type: 'link_count', value: 50 },
  },
  {
    id: 'web_weaver',
    name: 'Web Weaver',
    description: 'Create 200 memory links',
    icon: '🌐',
    category: 'network',
    requirement: { type: 'link_count', value: 200 },
  },

  // Special achievements
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Capture at least one memory every day for a week',
    icon: '⭐',
    category: 'special',
    requirement: { type: 'perfect_week', value: 7 },
  },
];

export function checkAchievement(achievement: Achievement, stats: any): boolean {
  const { type, value } = achievement.requirement;

  switch (type) {
    case 'capture_count':
      return stats.totalMemoriesCreated >= value;
    case 'review_count':
      return stats.totalReviewsCompleted >= value;
    case 'streak_days':
      return stats.currentStreakDays >= value || stats.longestStreakDays >= value;
    case 'link_count':
      return stats.totalLinksCreated >= value;
    case 'recall_rate':
      const totalReviews = stats.totalReviewsCompleted;
      if (totalReviews === 0) return false;
      const successfulReviews = stats.totalReviewsGood + stats.totalReviewsEasy;
      const recallRate = (successfulReviews / totalReviews) * 100;
      return recallRate >= value;
    case 'perfect_week':
      // This would require checking daily capture history (not implemented in basic stats)
      return stats.currentStreakDays >= 7;
    default:
      return false;
  }
}
