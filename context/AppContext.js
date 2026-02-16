import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

// Storage keys
const STORAGE_KEYS = {
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
};

// Default recurring goals for first launch
const DEFAULT_RECURRING_GOALS = [
    { id: 1, type: 'app', name: 'Instagram', limit: 30, used: 0, color: '#e4405f', completed: false },
    { id: 2, type: 'app', name: 'TikTok', limit: 45, used: 0, color: '#00f2ea', completed: false },
    { id: 3, type: 'habit', name: 'Meditate 10 min', completed: false },
];

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // User settings
    const [bedtime, setBedtimeState] = useState('22:00');
    const [userEmail, setUserEmailState] = useState('');
    const [use24HourFormat, setUse24HourFormatState] = useState(false);

    // Daily state
    const [currentStreak, setCurrentStreakState] = useState(0);
    const [longestStreak, setLongestStreakState] = useState(0);
    const [streakSavers, setStreakSaversState] = useState(0);
    const [lastOpenedDate, setLastOpenedDateState] = useState(new Date().toDateString());
    const [dayStarted, setDayStartedState] = useState(false);

    // Recurring goals
    const [recurringGoals, setRecurringGoalsState] = useState(DEFAULT_RECURRING_GOALS);

    // Daily intentions
    const [dailyIntentions, setDailyIntentionsState] = useState([]);

    // Load data from storage on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                savedBedtime,
                savedEmail,
                savedCurrentStreak,
                savedLongestStreak,
                savedStreakSavers,
                savedLastOpenedDate,
                savedDayStarted,
                savedRecurringGoals,
                savedDailyIntentions,
                savedUse24HourFormat,
            ] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.BEDTIME),
                AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL),
                AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STREAK),
                AsyncStorage.getItem(STORAGE_KEYS.LONGEST_STREAK),
                AsyncStorage.getItem(STORAGE_KEYS.STREAK_SAVERS),
                AsyncStorage.getItem(STORAGE_KEYS.LAST_OPENED_DATE),
                AsyncStorage.getItem(STORAGE_KEYS.DAY_STARTED),
                AsyncStorage.getItem(STORAGE_KEYS.RECURRING_GOALS),
                AsyncStorage.getItem(STORAGE_KEYS.DAILY_INTENTIONS),
                AsyncStorage.getItem(STORAGE_KEYS.USE_24_HOUR_FORMAT),
            ]);

            if (savedBedtime) setBedtimeState(savedBedtime);
            if (savedEmail) setUserEmailState(savedEmail);
            if (savedCurrentStreak) setCurrentStreakState(parseInt(savedCurrentStreak, 10));
            if (savedLongestStreak) setLongestStreakState(parseInt(savedLongestStreak, 10));
            if (savedStreakSavers) setStreakSaversState(parseInt(savedStreakSavers, 10));
            if (savedLastOpenedDate) setLastOpenedDateState(savedLastOpenedDate);
            if (savedDayStarted) setDayStartedState(savedDayStarted === 'true');
            if (savedRecurringGoals) setRecurringGoalsState(JSON.parse(savedRecurringGoals));
            if (savedDailyIntentions) setDailyIntentionsState(JSON.parse(savedDailyIntentions));
            if (savedUse24HourFormat !== null) setUse24HourFormatState(savedUse24HourFormat === 'true');
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Persisted setters
    const setBedtime = useCallback(async (value) => {
        setBedtimeState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.BEDTIME, value);
    }, []);

    const setUserEmail = useCallback(async (value) => {
        setUserEmailState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, value);
    }, []);

    const setUse24HourFormat = useCallback(async (value) => {
        setUse24HourFormatState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.USE_24_HOUR_FORMAT, value.toString());
    }, []);

    const setCurrentStreak = useCallback(async (value) => {
        setCurrentStreakState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_STREAK, value.toString());
    }, []);

    const setLongestStreak = useCallback(async (value) => {
        setLongestStreakState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.LONGEST_STREAK, value.toString());
    }, []);

    const setStreakSavers = useCallback(async (value) => {
        setStreakSaversState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.STREAK_SAVERS, value.toString());
    }, []);

    const setLastOpenedDate = useCallback(async (value) => {
        setLastOpenedDateState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPENED_DATE, value);
    }, []);

    const setDayStarted = useCallback(async (value) => {
        setDayStartedState(value);
        await AsyncStorage.setItem(STORAGE_KEYS.DAY_STARTED, value.toString());
    }, []);

    const setRecurringGoals = useCallback(async (goals) => {
        setRecurringGoalsState(goals);
        await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_GOALS, JSON.stringify(goals));
    }, []);

    const setDailyIntentions = useCallback(async (intentions) => {
        setDailyIntentionsState(intentions);
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_INTENTIONS, JSON.stringify(intentions));
    }, []);

    // Check if it's a new day (after 3am)
    const isNewDay = useCallback(() => {
        const now = new Date();
        const today = now.toDateString();
        const currentHour = now.getHours();

        // If it's before 3am, consider it part of previous day
        if (currentHour < 3) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return lastOpenedDate !== yesterday.toDateString();
        }

        return lastOpenedDate !== today;
    }, [lastOpenedDate]);

    // Reset for new day
    const startNewDay = useCallback(async () => {
        // Reset recurring goals
        const resetGoals = recurringGoals.map(goal => ({
            ...goal,
            completed: false,
            ...(goal.type === 'app' && { used: 0 })
        }));
        await setRecurringGoals(resetGoals);

        // Clear daily intentions
        await setDailyIntentions([]);

        // Update tracking
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour >= 3) {
            await setLastOpenedDate(now.toDateString());
        } else {
            // If before 3am, set to yesterday
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            await setLastOpenedDate(yesterday.toDateString());
        }

        await setDayStarted(false);
    }, [recurringGoals, setRecurringGoals, setDailyIntentions, setLastOpenedDate, setDayStarted]);

    // Add recurring goal
    const addRecurringGoal = useCallback(async (goal) => {
        const newGoals = [...recurringGoals, { ...goal, id: Date.now() }];
        await setRecurringGoals(newGoals);
    }, [recurringGoals, setRecurringGoals]);

    // Delete recurring goal
    const deleteRecurringGoal = useCallback(async (id) => {
        const newGoals = recurringGoals.filter(g => g.id !== id);
        await setRecurringGoals(newGoals);
    }, [recurringGoals, setRecurringGoals]);

    // Update recurring goal
    const updateRecurringGoal = useCallback(async (id, updates) => {
        const newGoals = recurringGoals.map(g =>
            g.id === id ? { ...g, ...updates } : g
        );
        await setRecurringGoals(newGoals);
    }, [recurringGoals, setRecurringGoals]);

    // Add daily intention
    const addDailyIntention = useCallback(async (text) => {
        const newIntention = {
            id: Date.now(),
            text: text.trim(),
            completed: false
        };
        const newIntentions = [...dailyIntentions, newIntention];
        await setDailyIntentions(newIntentions);
    }, [dailyIntentions, setDailyIntentions]);

    // Delete daily intention
    const deleteDailyIntention = useCallback(async (id) => {
        const newIntentions = dailyIntentions.filter(i => i.id !== id);
        await setDailyIntentions(newIntentions);
    }, [dailyIntentions, setDailyIntentions]);

    // Toggle daily intention
    const toggleDailyIntention = useCallback(async (id) => {
        const newIntentions = dailyIntentions.map(i =>
            i.id === id ? { ...i, completed: !i.completed } : i
        );
        await setDailyIntentions(newIntentions);
    }, [dailyIntentions, setDailyIntentions]);

    // Calculate streak savers earned from stretch goals
    const calculateStreakSaversEarned = useCallback(() => {
        const completedCount = dailyIntentions.filter(i => i.completed).length;

        if (completedCount === 0) return 0;
        if (completedCount === 1 || completedCount === 2) return 1;
        if (completedCount >= 3) return 2;

        return 0;
    }, [dailyIntentions]);

    // Complete day and calculate streak
    const completeDay = useCallback(async (useSaver = false) => {
        const allRecurringComplete = recurringGoals.every(g => g.completed);
        const saversEarned = calculateStreakSaversEarned();

        // Add earned savers (max 7)
        const newSaverCount = Math.min(streakSavers + saversEarned, 7);
        await setStreakSavers(newSaverCount);

        if (allRecurringComplete) {
            // Hit all recurring goals - increment streak
            const newStreak = currentStreak + 1;
            await setCurrentStreak(newStreak);
            if (newStreak > longestStreak) {
                await setLongestStreak(newStreak);
            }
            return {
                success: true,
                message: 'streak_maintained',
                saversEarned,
                newSaverCount
            };
        } else if (useSaver && streakSavers > 0) {
            // Use a saver to preserve streak (doesn't increment, just maintains)
            await setStreakSavers(streakSavers - 1);
            return {
                success: true,
                message: 'saver_used',
                saversEarned: 0,
                newSaverCount: streakSavers - 1
            };
        } else {
            // Break streak
            await setCurrentStreak(0);
            return {
                success: false,
                message: 'streak_broken',
                saversEarned: 0,
                newSaverCount: newSaverCount
            };
        }
    }, [recurringGoals, streakSavers, currentStreak, longestStreak, calculateStreakSaversEarned, setStreakSavers, setCurrentStreak, setLongestStreak]);

    // Calculate time saved
    const getTimeSaved = useCallback(() => {
        return recurringGoals
            .filter(g => g.type === 'app')
            .reduce((total, goal) => {
                const saved = Math.max(0, goal.limit - goal.used);
                return total + saved;
            }, 0);
    }, [recurringGoals]);

    // Check if evening review should be available
    const isEveningReviewTime = useCallback(() => {
        const now = new Date();
        const [hours, minutes] = bedtime.split(':');
        const bedtimeDate = new Date();
        bedtimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

        // Evening review available 1 hour before bedtime
        const reviewTime = new Date(bedtimeDate);
        reviewTime.setHours(reviewTime.getHours() - 1);

        return now >= reviewTime;
    }, [bedtime]);

    // Reset all data (for settings screen)
    const resetAllData = useCallback(async () => {
        await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
        setBedtimeState('22:00');
        setUserEmailState('');
        setUse24HourFormatState(false);
        setCurrentStreakState(0);
        setLongestStreakState(0);
        setStreakSaversState(0);
        setLastOpenedDateState(new Date().toDateString());
        setDayStartedState(false);
        setRecurringGoalsState(DEFAULT_RECURRING_GOALS);
        setDailyIntentionsState([]);
    }, []);

    const value = {
        // Loading state
        isLoading,

        // Settings
        bedtime,
        setBedtime,
        userEmail,
        setUserEmail,
        use24HourFormat,
        setUse24HourFormat,

        // Daily state
        currentStreak,
        longestStreak,
        streakSavers,
        dayStarted,
        setDayStarted,

        // Recurring goals
        recurringGoals,
        addRecurringGoal,
        deleteRecurringGoal,
        updateRecurringGoal,

        // Daily intentions
        dailyIntentions,
        addDailyIntention,
        deleteDailyIntention,
        toggleDailyIntention,

        // Actions
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
