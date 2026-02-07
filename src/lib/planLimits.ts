export type PlanType = 'free' | 'pro';

export interface PlanLimits {
  uploadsPerWeek: number;
  mockTestsPerWeek: number;
  activeTopics: number;
  testAttemptsPerTopic: number;
  regeneratesPerWeek: number;
  timedExams: boolean;
  verifiedExams: boolean;
  realWorldRewards: boolean;
  streakProtection: boolean;
  xpBoosts: boolean;
  mockCreation: boolean;
  mockSharing: boolean;
  verifiedAttemptsPerTopicPerDay?: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    uploadsPerWeek: 5,
    mockTestsPerWeek: 5,
    activeTopics: 5,
    testAttemptsPerTopic: 3,
    regeneratesPerWeek: 1,
    timedExams: false,
    verifiedExams: false,
    realWorldRewards: false,
    streakProtection: false,
    xpBoosts: false,
    mockCreation: false,
    mockSharing: false,
  },
  pro: {
    uploadsPerWeek: Infinity,
    mockTestsPerWeek: Infinity,
    activeTopics: Infinity,
    testAttemptsPerTopic: Infinity,
    regeneratesPerWeek: Infinity,
    timedExams: true,
    verifiedExams: true,
    realWorldRewards: true,
    streakProtection: true,
    xpBoosts: true,
    mockCreation: true,
    mockSharing: true,
    verifiedAttemptsPerTopicPerDay: 2,
  },
};

export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
};

export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  pro: 8,
};

export type FeatureName = keyof PlanLimits;

export const FEATURE_DESCRIPTIONS: Record<FeatureName, string> = {
  uploadsPerWeek: 'File uploads per week',
  mockTestsPerWeek: 'Mock tests per week',
  activeTopics: 'Active topics',
  testAttemptsPerTopic: 'Test attempts per topic',
  regeneratesPerWeek: 'Regenerate sets per week',
  timedExams: 'Timed exams',
  verifiedExams: 'Verified exams',
  realWorldRewards: 'Real-world rewards',
  streakProtection: 'Streak protection',
  xpBoosts: 'XP boosts for high scores',
  mockCreation: 'Create custom mock tests',
  mockSharing: 'Share mock test links',
  verifiedAttemptsPerTopicPerDay: 'Verified exam attempts per day',
};

// XP earning values
export const XP_VALUES = {
  flashcard_review: 5,
  flashcard_master: 15,
  question_correct: 10,
  practice_session: 25,
  mock_test_complete: 50,
  score_80_plus_bonus: 25,
  score_100_bonus: 50,
  daily_login: 10,
  streak_7_day_bonus: 100,
  streak_30_day_bonus: 500,
} as const;

// Level calculation
export function calculateLevel(xpTotal: number): number {
  return Math.floor(Math.sqrt(xpTotal / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function xpForNextLevel(currentLevel: number): number {
  return xpForLevel(currentLevel + 1);
}

export function xpProgressInLevel(xpTotal: number): number {
  const level = calculateLevel(xpTotal);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progressXp = xpTotal - currentLevelXp;
  const totalRequired = nextLevelXp - currentLevelXp;
  return totalRequired > 0 ? (progressXp / totalRequired) * 100 : 0;
}
