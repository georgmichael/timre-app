import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import { useApp } from '../context/AppContext';

const KEEP_GOING_QUOTES = [
    "Tomorrow is a new opportunity to be better than you were today.",
    "Every setback is a setup for a comeback.",
    "Progress isn't linear. Keep showing up.",
    "The only failure is giving up. You're still in the game.",
    "Small steps forward are still steps forward.",
    "Your commitment to try again is what matters most.",
    "Success is built on a foundation of well-handled failures.",
    "It's not about being perfect, it's about being persistent.",
    "Today didn't go as planned. Tomorrow is yours to shape.",
    "The difference between who you are and who you want to be is what you do.",
    "Discipline is choosing between what you want now and what you want most.",
    "You're not starting over, you're starting with experience.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Your future self is counting on the choices you make tomorrow.",
    "Consistency beats perfection every time.",
    "One day at a time. One choice at a time.",
    "The comeback is always stronger than the setback.",
    "You didn't come this far to only come this far.",
    "Fall seven times, stand up eight.",
    "What you do today can improve all your tomorrows.",
    "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up. - Galatians 6:9",
    "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future. - Jeremiah 29:11",
    "I can do all things through Christ who strengthens me. - Philippians 4:13",
    "The Lord is my strength and my shield; my heart trusts in him, and he helps me. - Psalm 28:7",
    "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go. - Joshua 1:9",
    "Therefore we do not lose heart. Though outwardly we are wasting away, yet inwardly we are being renewed day by day. - 2 Corinthians 4:16",
    "But those who hope in the Lord will renew their strength. They will soar on wings like eagles. - Isaiah 40:31",
    "Consider it pure joy whenever you face trials, because you know that the testing of your faith produces perseverance. - James 1:2-3",
    "Commit to the Lord whatever you do, and he will establish your plans. - Proverbs 16:3",
    "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning. - Lamentations 3:22-23",
    "And we know that in all things God works for the good of those who love him. - Romans 8:28",
    "Forgetting what is behind and straining toward what is ahead, I press on toward the goal. - Philippians 3:13-14",
    "Do not despise these small beginnings, for the Lord rejoices to see the work begin. - Zechariah 4:10",
    "The Lord himself goes before you and will be with you; he will never leave you nor forsake you. - Deuteronomy 31:8",
    "Trust in the Lord with all your heart and lean not on your own understanding. - Proverbs 3:5",
    "He gives strength to the weary and increases the power of the weak. - Isaiah 40:29",
    "Start children off on the way they should go, and even when they are old they will not turn from it. - Proverbs 22:6",
    "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness. - Hebrews 12:11",
    "Whatever you do, work at it with all your heart, as working for the Lord. - Colossians 3:23",
    "The Lord is close to the brokenhearted and saves those who are crushed in spirit. - Psalm 34:18",
];

const getRandomQuote = () => {
    return KEEP_GOING_QUOTES[Math.floor(Math.random() * KEEP_GOING_QUOTES.length)];
};

export default function EveningReviewScreen({ navigation }) {
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

    const toggleIntention = (id) => {
        toggleDailyIntention(id);
    };

    const toggleHabit = (id) => {
        const goal = recurringGoals.find(g => g.id === id);
        updateRecurringGoal(id, { completed: !goal.completed });
    };

    const finishDay = () => {
        const allRecurringComplete = recurringGoals.every(g => g.completed);
        const intentionsCompleted = dailyIntentions.filter(i => i.completed).length;
        const saversEarned = calculateStreakSaversEarned();

        if (allRecurringComplete) {
            // Hit all recurring goals - streak continues!
            const result = completeDay(false);
            Alert.alert(
                '🔥 Streak Day!',
                `Amazing work! You hit all recurring goals and completed ${intentionsCompleted} intention${intentionsCompleted !== 1 ? 's' : ''}.\n\nYour ${currentStreak + 1}-day streak continues!${saversEarned > 0 ? `\n\n+${saversEarned} Streak Saver${saversEarned > 1 ? 's' : ''} earned! (${result.newSaverCount}/7)` : ''}`,
                [{ text: 'Finish Day', onPress: () => navigation.navigate('Home') }]
            );
        } else if (streakSavers > 0) {
            // Missed goals but have savers - offer to use one
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
                                [{ text: 'Finish Day', onPress: () => navigation.navigate('Home') }]
                            );
                        }
                    },
                    {
                        text: `Use Saver (${streakSavers - 1} left)`,
                        onPress: () => {
                            const quote = getRandomQuote();
                            completeDay(true);
                            Alert.alert(
                                'Streak Preserved',
                                `"${quote}"\n\nYour ${currentStreak}-day streak is safe! You have ${streakSavers - 1} Streak Saver${streakSavers - 1 !== 1 ? 's' : ''} remaining.\n\nRemember: Savers don't increment your streak, they just protect it for a day.`,
                                [{ text: 'Finish Day', onPress: () => navigation.navigate('Home') }]
                            );
                        }
                    }
                ]
            );
        } else {
            // Missed goals and no savers - streak breaks
            const quote = getRandomQuote();
            completeDay(false);
            Alert.alert(
                '💪 Keep Going',
                `"${quote}"\n\nYou didn't hit all your recurring goals today, but showing up and reflecting means you're still building the habit. Your streak resets, but tomorrow is a fresh start.`,
                [{ text: 'I\'ll Do Better Tomorrow', onPress: () => navigation.navigate('Home') }]
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
                    <View style={[styles.streakCard, willMaintainStreak ? styles.streakGood : styles.streakWarning]}>
                        <Text style={styles.streakEmoji}>{willMaintainStreak ? '🔥' : '⚠️'}</Text>
                        <View style={styles.streakTextContainer}>
                            <Text style={styles.streakText}>
                                {recurringGoalsComplete
                                    ? `Streak continues! ${currentStreak} → ${currentStreak + 1} days`
                                    : streakSavers > 0
                                        ? `You have ${streakSavers} Streak Saver${streakSavers > 1 ? 's' : ''} available`
                                        : 'Complete all recurring goals to maintain streak'}
                            </Text>
                            {saversWillEarn > 0 && (
                                <Text style={styles.saversEarnedText}>
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
                                const onTrack = goal.used <= goal.limit;
                                // Auto-mark app goals as complete/incomplete based on usage
                                if (goal.completed !== onTrack) {
                                    updateRecurringGoal(goal.id, { completed: onTrack });
                                }

                                return (
                                    <View key={goal.id} style={styles.goalCard}>
                                        <View style={styles.goalContent}>
                                            <Text style={styles.goalName}>{goal.name}</Text>
                                            <Text style={[styles.goalStatus, onTrack ? styles.statusGood : styles.statusBad]}>
                                                {goal.used}/{goal.limit} min {onTrack ? '✓' : '✗'}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, onTrack ? styles.badgeGood : styles.badgeBad]}>
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
                                    onPress={() => toggleIntention(intention.id)}
                                >
                                    <View style={styles.intentionContent}>
                                        <Text style={[
                                            styles.intentionText,
                                            intention.completed && styles.intentionCompleted
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
                            <Text style={[styles.summaryValue, recurringGoalsComplete ? styles.summaryGood : styles.summaryBad]}>
                                {recurringGoals.filter(g => g.completed).length}/{recurringGoals.length}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Daily Intentions:</Text>
                            <Text style={[styles.summaryValue, intentionsComplete > 0 ? styles.summaryGood : styles.summaryNeutral]}>
                                {intentionsComplete}/{dailyIntentions.length}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Minutes Saved:</Text>
                            <Text style={styles.summaryValue}>{totalSaved} min</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Streak Savers:</Text>
                            <Text style={styles.summaryValue}>{streakSavers + saversWillEarn}/7</Text>
                        </View>
                    </View>

                    {/* Complete Day Button */}
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={finishDay}
                    >
                        <Text style={styles.completeButtonText}>Complete Day</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 24,
        lineHeight: 24,
    },
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 12,
        marginBottom: 32,
    },
    streakGood: {
        backgroundColor: '#166534',
    },
    streakWarning: {
        backgroundColor: '#7c2d12',
    },
    streakEmoji: {
        fontSize: 32,
        marginRight: 16,
    },
    streakTextContainer: {
        flex: 1,
    },
    streakText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    saversEarnedText: {
        fontSize: 14,
        color: '#86efac',
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    goalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    goalContent: {
        flex: 1,
    },
    goalName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    goalStatus: {
        fontSize: 14,
    },
    statusGood: {
        color: '#22c55e',
    },
    statusBad: {
        color: '#ef4444',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeGood: {
        backgroundColor: '#166534',
    },
    badgeBad: {
        backgroundColor: '#7f1d1d',
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    checkbox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#64748b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
    },
    checkmark: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    intentionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    intentionContent: {
        flex: 1,
        marginRight: 12,
    },
    intentionText: {
        fontSize: 16,
        color: '#ffffff',
    },
    intentionCompleted: {
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },
    emptyCard: {
        backgroundColor: '#1e293b',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
    },
    summaryCard: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#94a3b8',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    summaryGood: {
        color: '#22c55e',
    },
    summaryBad: {
        color: '#ef4444',
    },
    summaryNeutral: {
        color: '#94a3b8',
    },
    completeButton: {
        backgroundColor: '#3b82f6',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    completeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});