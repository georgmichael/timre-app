export const STORAGE_KEYS = {
  BEDTIME: '@timre_bedtime',
  USER_EMAIL: '@timre_userEmail',
  CURRENT_STREAK: '@timre_currentStreak',
  LONGEST_STREAK: '@timre_longestStreak',
  STREAK_SAVERS: '@timre_streakSavers',
  LAST_OPENED_DATE: '@timre_lastOpenedDate',
  DAY_STARTED: '@timre_dayStarted',
  RECURRING_GOALS: '@timre_recurringGoals',
  DAILY_INTENTIONS: '@timre_dailyIntentions',
  USE_24_HOUR_FORMAT: '@timre_use24HourFormat',
  COMPLETION_HISTORY: '@timre_completionHistory',
  ONBOARDING_COMPLETED: '@timre_onboarding_completed',
} as const;

export const NOTIFICATION_KEYS = {
  ENABLED: '@timre_notifications_enabled',
  MORNING_HOUR: '@timre_morning_hour',
  MORNING_MINUTE: '@timre_morning_minute',
} as const;
