export type AppGoal = {
  id: number | string;
  type: 'app';
  name: string;
  limit: number;
  used: number;
  color: string;
  completed: boolean;
};

export type HabitGoal = {
  id: number | string;
  type: 'habit';
  name: string;
  color?: string;
  completed: boolean;
};

export type RecurringGoal = AppGoal | HabitGoal;

export type Intention = {
  id: number;
  text: string;
  completed: boolean;
};

export type CompleteDayResult = {
  success: boolean;
  message: 'streak_maintained' | 'saver_used' | 'streak_broken';
  saversEarned: number;
  newSaverCount: number;
};

export type ThemeMode = 'light' | 'dark' | 'system';
