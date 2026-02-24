import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { MAX_STREAK_SAVERS } from '../constants/limits';
import { getRandomQuote } from '../constants/strings';
import { AppGoal } from '../types';
import { EveningReviewScreenProps } from '../types/navigation';

export default function EveningReviewScreen({ navigation }: EveningReviewScreenProps) {
  const {
    currentStreak,
    streakSavers,
    recurringGoals,
    dailyIntentions,
    toggleDailyIntention,
    updateRecurringGoal,
    completeDay,
    getTimeSaved,
    calculateStreakSaversEarned,
  } = useApp();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const toggleHabit = (id: number | string) => {
    const goal = recurringGoals.find(g => g.id === id);
    if (goal) {
      updateRecurringGoal(id, { completed: !goal.completed });
    }
  };

  const finishDay = () => {
    const allRecurringComplete = recurringGoals.every(g => g.completed);
    const intentionsCompleted = dailyIntentions.filter(i => i.completed).length;
    const saversEarned = calculateStreakSaversEarned();

    if (allRecurringComplete) {
      const result = completeDay(false);
      Alert.alert(
        '🔥 Streak Day!',
        `Amazing work! You hit all recurring goals and completed ${intentionsCompleted} intention${intentionsCompleted !== 1 ? 's' : ''}.\n\nYour ${currentStreak + 1}-day streak continues!${saversEarned > 0 ? `\n\n+${saversEarned} Streak Saver${saversEarned > 1 ? 's' : ''} earned! (${(result as any).newSaverCount}/${MAX_STREAK_SAVERS})` : ''}`,
        [{ text: 'Finish Day', onPress: () => navigation.navigate('Home') }],
      );
    } else if (streakSavers > 0) {
      Alert.alert(
        'Use a Streak Saver?',
        `You didn't hit all recurring goals today.\n\nYou have ${streakSavers} Streak Saver${streakSavers > 1 ? 's' : ''}. Use one to preserve your ${currentStreak}-day streak?`,
        [
          {
            text: 'Let Streak Reset',
            style: 'destructive',
            onPress: () => {
              const quote = getRandomQuote();
              completeDay(false);
              Alert.alert(
                'Fresh Start',
                `"${quote}"\n\nYour streak has reset. Tomorrow is a new opportunity to build it back up!`,
                [{ text: 'Finish Day', onPress: () => navigation.navigate('Home') }],
              );
            },
          },
          {
            text: `Use Saver (${streakSavers - 1} left)`,
            onPress: () => {
              const quote = getRandomQuote();
              completeDay(true);
              Alert.alert(
                'Streak Preserved',
                `"${quote}"\n\nYour ${currentStreak}-day streak is safe! You have ${streakSavers - 1} Streak Saver${streakSavers - 1 !== 1 ? 's' : ''} remaining.\n\nRemember: Savers don't increment your streak, they just protect it for a day.`,
                [{ text: 'Finish Day', onPress: () => navigation.navigate('Home') }],
              );
            },
          },
        ],
      );
    } else {
      const quote = getRandomQuote();
      completeDay(false);
      Alert.alert(
        '💪 Keep Going',
        `"${quote}"\n\nYou didn't hit all your recurring goals today, but showing up and reflecting means you're still building the habit. Your streak resets, but tomorrow is a fresh start.`,
        [{ text: "I'll Do Better Tomorrow", onPress: () => navigation.navigate('Home') }],
      );
    }
  };

  const recurringGoalsComplete = recurringGoals.every(g => g.completed);
  const intentionsComplete = dailyIntentions.filter(i => i.completed).length;
  const willMaintainStreak = recurringGoalsComplete || streakSavers > 0;
  const totalSaved = getTimeSaved();
  const saversWillEarn = calculateStreakSaversEarned();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>How was your day?</Text>
          <Text style={styles.description}>
            Review your goals and mark what you accomplished.
          </Text>

          {/* Streak Status */}
          <View style={[
            styles.streakCard,
            { backgroundColor: willMaintainStreak ? theme.streakGoodBg : theme.streakWarningBg },
          ]}>
            <Text style={styles.streakEmoji}>{willMaintainStreak ? '🔥' : '⚠️'}</Text>
            <View style={styles.streakTextContainer}>
              <Text style={[styles.streakText, { color: willMaintainStreak ? theme.streakGoodText : theme.streakWarningText }]}>
                {recurringGoalsComplete
                  ? `Streak continues! ${currentStreak} → ${currentStreak + 1} days`
                  : streakSavers > 0
                  ? `You have ${streakSavers} Streak Saver${streakSavers > 1 ? 's' : ''} available`
                  : 'Complete all recurring goals to maintain streak'}
              </Text>
              {saversWillEarn > 0 && (
                <Text style={[styles.saversEarnedText, { color: theme.streakGoodText }]}>
                  +{saversWillEarn} Streak Saver{saversWillEarn > 1 ? 's' : ''} earned today! 🎉
                </Text>
              )}
            </View>
          </View>

          {/* Recurring Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurring Goals</Text>

            {recurringGoals.map((goal) => {
              if (goal.type === 'app') {
                const appGoal = goal as AppGoal;
                const onTrack = appGoal.used <= appGoal.limit;
                if (appGoal.completed !== onTrack) {
                  updateRecurringGoal(appGoal.id, { completed: onTrack });
                }

                return (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalContent}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={[styles.goalStatus, { color: onTrack ? theme.success : theme.error }]}>
                        {appGoal.used}/{appGoal.limit} min {onTrack ? '✓' : '✗'}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: onTrack ? theme.streakGoodBg : theme.streakWarningBg },
                    ]}>
                      <Text style={styles.badgeText}>{onTrack ? 'Hit' : 'Over'}</Text>
                    </View>
                  </View>
                );
              } else {
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalCard}
                    onPress={() => toggleHabit(goal.id)}
                  >
                    <View style={styles.goalContent}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                    </View>
                    <View style={[styles.checkbox, goal.completed && styles.checkboxChecked]}>
                      {goal.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }
            })}
          </View>

          {/* Daily Intentions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Today's Intentions ({intentionsComplete}/{dailyIntentions.length} completed)
            </Text>

            {dailyIntentions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No intentions set today</Text>
              </View>
            ) : (
              dailyIntentions.map((intention) => (
                <TouchableOpacity
                  key={intention.id}
                  style={styles.intentionCard}
                  onPress={() => toggleDailyIntention(intention.id)}
                >
                  <View style={styles.intentionContent}>
                    <Text style={[
                      styles.intentionText,
                      intention.completed && styles.intentionCompleted,
                    ]}>
                      {intention.text}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, intention.completed && styles.checkboxChecked]}>
                    {intention.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recurring Goals:</Text>
              <Text style={[styles.summaryValue, { color: recurringGoalsComplete ? theme.success : theme.error }]}>
                {recurringGoals.filter(g => g.completed).length}/{recurringGoals.length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Daily Intentions:</Text>
              <Text style={[styles.summaryValue, { color: intentionsComplete > 0 ? theme.success : theme.textSecondary }]}>
                {intentionsComplete}/{dailyIntentions.length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Minutes Saved:</Text>
              <Text style={styles.summaryValue}>{totalSaved} min</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Streak Savers:</Text>
              <Text style={styles.summaryValue}>{streakSavers + saversWillEarn}/{MAX_STREAK_SAVERS}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.completeButton} onPress={finishDay}>
            <Text style={styles.completeButtonText}>Complete Day</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    content: { padding: 24 },
    title: { fontSize: 32, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 8 },
    description: { fontSize: 16, color: theme.textSecondary, marginBottom: 24, lineHeight: 24 },
    streakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      marginBottom: 32,
    },
    streakEmoji: { fontSize: 32, marginRight: 16 },
    streakTextContainer: { flex: 1 },
    streakText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    saversEarnedText: { fontSize: 14, fontWeight: '600' },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginBottom: 16 },
    goalCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    goalContent: { flex: 1 },
    goalName: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
    goalStatus: { fontSize: 14 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
    checkbox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.textTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: { backgroundColor: theme.success, borderColor: theme.success },
    checkmark: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
    intentionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    intentionContent: { flex: 1, marginRight: 12 },
    intentionText: { fontSize: 16, color: theme.textPrimary },
    intentionCompleted: { color: theme.textSecondary, textDecorationLine: 'line-through' },
    emptyCard: {
      backgroundColor: theme.surface,
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
    },
    emptyText: { fontSize: 16, color: theme.textTertiary },
    summaryCard: {
      backgroundColor: theme.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
    },
    summaryTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 16 },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: { fontSize: 16, color: theme.textSecondary },
    summaryValue: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    completeButton: {
      backgroundColor: theme.accent,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
    },
    completeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  });
