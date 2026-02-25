import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecurringGoal, Intention, AppGoal, CompleteDayResult } from '../types';
import { STORAGE_KEYS } from '../constants/storage';
import { MAX_STREAK_SAVERS, DAY_BOUNDARY_HOUR } from '../constants/limits';
import { DEFAULT_BEDTIME } from '../constants/defaults';

const DEFAULT_RECURRING_GOALS: RecurringGoal[] = [
  { id: 1, type: 'app', name: 'Instagram', limit: 30, used: 0, color: '#e4405f', completed: false },
  { id: 2, type: 'app', name: 'TikTok', limit: 45, used: 0, color: '#00f2ea', completed: false },
  { id: 3, type: 'habit', name: 'Meditate 10 min', completed: false },
];

// Returns the "effective today" date string, accounting for the 3am day boundary
const getEffectiveToday = (): string => {
  const now = new Date();
  if (now.getHours() < DAY_BOUNDARY_HOUR) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  }
  return now.toDateString();
};

// Derives the current streak by counting consecutive days back from today in the history set
const calculateCurrentStreak = (history: string[]): number => {
  if (history.length === 0) return 0;
  const historySet = new Set(history);
  let streak = 0;
  const cursor = new Date();
  if (cursor.getHours() < DAY_BOUNDARY_HOUR) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (historySet.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

// Finds the longest consecutive run across the entire history
const calculateLongestStreak = (history: string[]): number => {
  if (history.length === 0) return 0;
  const sorted = [...history]
    .map(d => new Date(d).getTime())
    .sort((a, b) => a - b);
  let longest = 1;
  let current = 1;
  const DAY_MS = 86400000;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === DAY_MS) {
      current++;
      if (current > longest) longest = current;
    } else if (sorted[i] !== sorted[i - 1]) {
      current = 1;
    }
  }
  return longest;
};

interface AppContextValue {
  isLoading: boolean;
  bedtime: string;
  setBedtime: (value: string) => Promise<void>;
  userEmail: string;
  setUserEmail: (value: string) => Promise<void>;
  use24HourFormat: boolean;
  setUse24HourFormat: (value: boolean) => Promise<void>;
  currentStreak: number;
  longestStreak: number;
  streakSavers: number;
  dayStarted: boolean;
  setDayStarted: (value: boolean) => Promise<void>;
  recurringGoals: RecurringGoal[];
  addRecurringGoal: (goal: Omit<RecurringGoal, 'id'>) => Promise<void>;
  deleteRecurringGoal: (id: number | string) => Promise<void>;
  updateRecurringGoal: (id: number | string, updates: Partial<AppGoal> | Partial<RecurringGoal>) => Promise<void>;
  dailyIntentions: Intention[];
  addDailyIntention: (text: string) => Promise<void>;
  deleteDailyIntention: (id: number) => Promise<void>;
  toggleDailyIntention: (id: number) => Promise<void>;
  isNewDay: () => boolean;
  startNewDay: () => Promise<void>;
  completeDay: (useSaver?: boolean) => Promise<CompleteDayResult>;
  getTimeSaved: () => number;
  isEveningReviewTime: () => boolean;
  calculateStreakSaversEarned: () => number;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  const [bedtime, setBedtimeState] = useState(DEFAULT_BEDTIME);
  const [userEmail, setUserEmailState] = useState('');
  const [use24HourFormat, setUse24HourFormatState] = useState(false);

  // Streak state — currentStreak is derived from completionHistory
  const [completionHistory, setCompletionHistoryState] = useState<string[]>([]);
  const [streakSavers, setStreakSaversState] = useState(0);
  const [lastOpenedDate, setLastOpenedDateState] = useState(new Date().toDateString());
  const [dayStarted, setDayStartedState] = useState(false);

  const [recurringGoals, setRecurringGoalsState] = useState<RecurringGoal[]>(DEFAULT_RECURRING_GOALS);
  const [dailyIntentions, setDailyIntentionsState] = useState<Intention[]>([]);

  // Derived streak values — recalculate whenever history changes
  const currentStreak = useMemo(() => calculateCurrentStreak(completionHistory), [completionHistory]);
  const longestStreak = useMemo(() => calculateLongestStreak(completionHistory), [completionHistory]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        savedBedtime,
        savedEmail,
        savedStreakSavers,
        savedLastOpenedDate,
        savedDayStarted,
        savedRecurringGoals,
        savedDailyIntentions,
        savedUse24HourFormat,
        savedCompletionHistory,
        // Legacy — migrate old manually-stored streak if history doesn't exist yet
        savedLegacyStreak,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BEDTIME),
        AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_SAVERS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_OPENED_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.DAY_STARTED),
        AsyncStorage.getItem(STORAGE_KEYS.RECURRING_GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_INTENTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.USE_24_HOUR_FORMAT),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETION_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STREAK),
      ]);

      if (savedBedtime) setBedtimeState(savedBedtime);
      if (savedEmail) setUserEmailState(savedEmail);
      if (savedStreakSavers) setStreakSaversState(parseInt(savedStreakSavers, 10));
      if (savedLastOpenedDate) setLastOpenedDateState(savedLastOpenedDate);
      if (savedDayStarted) setDayStartedState(savedDayStarted === 'true');
      if (savedRecurringGoals) setRecurringGoalsState(JSON.parse(savedRecurringGoals));
      if (savedDailyIntentions) setDailyIntentionsState(JSON.parse(savedDailyIntentions));
      if (savedUse24HourFormat !== null) setUse24HourFormatState(savedUse24HourFormat === 'true');

      if (savedCompletionHistory) {
        setCompletionHistoryState(JSON.parse(savedCompletionHistory));
      } else if (savedLegacyStreak) {
        // Migration: synthesize history from old manual streak counter
        const legacyStreak = parseInt(savedLegacyStreak, 10);
        if (legacyStreak > 0) {
          const synthetic: string[] = [];
          const cursor = new Date();
          if (cursor.getHours() < DAY_BOUNDARY_HOUR) cursor.setDate(cursor.getDate() - 1);
          for (let i = 0; i < legacyStreak; i++) {
            const d = new Date(cursor);
            d.setDate(d.getDate() - i);
            synthetic.push(d.toDateString());
          }
          setCompletionHistoryState(synthetic);
          await AsyncStorage.setItem(STORAGE_KEYS.COMPLETION_HISTORY, JSON.stringify(synthetic));
        }
      }
    } catch {
      // Silently handle load error — app will use default state
    } finally {
      setIsLoading(false);
    }
  };

  const setBedtime = useCallback(async (value: string) => {
    setBedtimeState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.BEDTIME, value);
  }, []);

  const setUserEmail = useCallback(async (value: string) => {
    setUserEmailState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, value);
  }, []);

  const setUse24HourFormat = useCallback(async (value: boolean) => {
    setUse24HourFormatState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.USE_24_HOUR_FORMAT, value.toString());
  }, []);

  const setStreakSavers = useCallback(async (value: number) => {
    setStreakSaversState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_SAVERS, value.toString());
  }, []);

  const setLastOpenedDate = useCallback(async (value: string) => {
    setLastOpenedDateState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPENED_DATE, value);
  }, []);

  const setDayStarted = useCallback(async (value: boolean) => {
    setDayStartedState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.DAY_STARTED, value.toString());
  }, []);

  const setRecurringGoals = useCallback(async (goals: RecurringGoal[]) => {
    setRecurringGoalsState(goals);
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_GOALS, JSON.stringify(goals));
  }, []);

  const setDailyIntentions = useCallback(async (intentions: Intention[]) => {
    setDailyIntentionsState(intentions);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_INTENTIONS, JSON.stringify(intentions));
  }, []);

  const setCompletionHistory = useCallback(async (history: string[]) => {
    setCompletionHistoryState(history);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETION_HISTORY, JSON.stringify(history));
  }, []);

  const isNewDay = useCallback(() => {
    const effectiveToday = getEffectiveToday();
    return lastOpenedDate !== effectiveToday;
  }, [lastOpenedDate]);

  const startNewDay = useCallback(async () => {
    const resetGoals = recurringGoals.map(goal => ({
      ...goal,
      completed: false,
      ...(goal.type === 'app' && { used: 0 }),
    }));
    await setRecurringGoals(resetGoals);
    await setDailyIntentions([]);
    await setLastOpenedDate(getEffectiveToday());
    await setDayStarted(false);
  }, [recurringGoals, setRecurringGoals, setDailyIntentions, setLastOpenedDate, setDayStarted]);

  const addRecurringGoal = useCallback(async (goal: Omit<RecurringGoal, 'id'>) => {
    const newGoals = [...recurringGoals, { ...goal, id: Date.now() } as RecurringGoal];
    await setRecurringGoals(newGoals);
  }, [recurringGoals, setRecurringGoals]);

  const deleteRecurringGoal = useCallback(async (id: number | string) => {
    const newGoals = recurringGoals.filter(g => g.id !== id);
    await setRecurringGoals(newGoals);
  }, [recurringGoals, setRecurringGoals]);

  const updateRecurringGoal = useCallback(async (
    id: number | string,
    updates: Partial<AppGoal> | Partial<RecurringGoal>,
  ) => {
    const newGoals = recurringGoals.map(g =>
      g.id === id ? { ...g, ...updates } as RecurringGoal : g,
    );
    await setRecurringGoals(newGoals);
  }, [recurringGoals, setRecurringGoals]);

  const addDailyIntention = useCallback(async (text: string) => {
    const newIntention: Intention = { id: Date.now(), text: text.trim(), completed: false };
    await setDailyIntentions([...dailyIntentions, newIntention]);
  }, [dailyIntentions, setDailyIntentions]);

  const deleteDailyIntention = useCallback(async (id: number) => {
    await setDailyIntentions(dailyIntentions.filter(i => i.id !== id));
  }, [dailyIntentions, setDailyIntentions]);

  const toggleDailyIntention = useCallback(async (id: number) => {
    await setDailyIntentions(dailyIntentions.map(i =>
      i.id === id ? { ...i, completed: !i.completed } : i,
    ));
  }, [dailyIntentions, setDailyIntentions]);

  const calculateStreakSaversEarned = useCallback(() => {
    const completedCount = dailyIntentions.filter(i => i.completed).length;
    if (completedCount === 0) return 0;
    if (completedCount <= 2) return 1;
    return 2;
  }, [dailyIntentions]);

  const completeDay = useCallback(async (useSaver = false): Promise<CompleteDayResult> => {
    const allRecurringComplete = recurringGoals.every(g => g.completed);
    const saversEarned = calculateStreakSaversEarned();

    const newSaverCount = Math.min(streakSavers + saversEarned, MAX_STREAK_SAVERS);
    await setStreakSavers(newSaverCount);

    if (allRecurringComplete) {
      // Add today to history — streak auto-calculates from the consecutive run
      const today = getEffectiveToday();
      const newHistory = completionHistory.includes(today)
        ? completionHistory
        : [...completionHistory, today];
      await setCompletionHistory(newHistory);
      return { success: true, message: 'streak_maintained', saversEarned, newSaverCount };
    } else if (useSaver && streakSavers > 0) {
      // Saver covers the day — add to history so the streak isn't broken
      const today = getEffectiveToday();
      const newHistory = completionHistory.includes(today)
        ? completionHistory
        : [...completionHistory, today];
      await setCompletionHistory(newHistory);
      await setStreakSavers(newSaverCount - saversEarned - 1); // consume one saver
      return { success: true, message: 'saver_used', saversEarned: 0, newSaverCount: streakSavers - 1 };
    } else {
      // Streak broken — today is absent from history, streak will auto-calculate to 0
      return { success: false, message: 'streak_broken', saversEarned: 0, newSaverCount };
    }
  }, [recurringGoals, streakSavers, completionHistory, calculateStreakSaversEarned, setStreakSavers, setCompletionHistory]);

  const getTimeSaved = useCallback(() => {
    return recurringGoals
      .filter((g): g is AppGoal => g.type === 'app')
      .reduce((total, goal) => total + Math.max(0, goal.limit - goal.used), 0);
  }, [recurringGoals]);

  const isEveningReviewTime = useCallback(() => {
    const now = new Date();
    const [hours, minutes] = bedtime.split(':');
    const bedtimeDate = new Date();
    bedtimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    const reviewTime = new Date(bedtimeDate);
    reviewTime.setHours(reviewTime.getHours() - 1);
    return now >= reviewTime;
  }, [bedtime]);

  const resetAllData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setBedtimeState(DEFAULT_BEDTIME);
    setUserEmailState('');
    setUse24HourFormatState(false);
    setCompletionHistoryState([]);
    setStreakSaversState(0);
    setLastOpenedDateState(new Date().toDateString());
    setDayStartedState(false);
    setRecurringGoalsState(DEFAULT_RECURRING_GOALS);
    setDailyIntentionsState([]);
  }, []);

  const value: AppContextValue = {
    isLoading,
    bedtime,
    setBedtime,
    userEmail,
    setUserEmail,
    use24HourFormat,
    setUse24HourFormat,
    currentStreak,
    longestStreak,
    streakSavers,
    dayStarted,
    setDayStarted,
    recurringGoals,
    addRecurringGoal,
    deleteRecurringGoal,
    updateRecurringGoal,
    dailyIntentions,
    addDailyIntention,
    deleteDailyIntention,
    toggleDailyIntention,
    isNewDay,
    startNewDay,
    completeDay,
    getTimeSaved,
    isEveningReviewTime,
    calculateStreakSaversEarned,
    resetAllData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
