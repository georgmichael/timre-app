import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useApp } from '../context/AppContext';
import CircularProgress from '../components/CircularProgress';


export default function HomeScreen({ navigation }) {
    const {
        currentStreak,
        streakSavers,
        recurringGoals,
        dailyIntentions,
        addDailyIntention,
        updateRecurringGoal,
        getTimeSaved,
        isEveningReviewTime,
        isNewDay,
        dayStarted,
    } = useApp();

    const [showAddModal, setShowAddModal] = useState(false);
    const [intentionText, setIntentionText] = useState('');

    // Time logging state
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [timeInput, setTimeInput] = useState('');

    // Check if it's a new day on mount
    useEffect(() => {
        if (isNewDay() && !dayStarted) {
            // Navigate to morning check-in
            navigation.navigate('MorningCheckIn');
        }
    }, []);

    const addIntention = () => {
        if (!intentionText.trim()) {
            return;
        }

        addDailyIntention(intentionText);

        // Reset form and close
        setIntentionText('');
        setShowAddModal(false);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setIntentionText('');
    };

    const openTimeModal = (goal) => {
        setSelectedGoal(goal);
        setTimeInput(goal.used.toString());
        setShowTimeModal(true);
    };

    const closeTimeModal = () => {
        setShowTimeModal(false);
        setSelectedGoal(null);
        setTimeInput('');
    };

    const saveTime = () => {
        if (selectedGoal) {
            const minutes = parseInt(timeInput, 10) || 0;
            updateRecurringGoal(selectedGoal.id, {
                used: minutes,
                completed: minutes <= selectedGoal.limit
            });
        }
        closeTimeModal();
    };

    const addTime = (minutes) => {
        const current = parseInt(timeInput, 10) || 0;
        setTimeInput((current + minutes).toString());
    };

    const totalSaved = getTimeSaved();
    const showEveningReview = isEveningReviewTime();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header with Streak */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.date}>
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                        <Text style={styles.greeting}>Stay focused 💪</Text>
                    </View>

                    <View style={styles.headerRight}>
                        {/* Streak Counter */}
                        <CircularProgress
                            size={100}
                            strokeWidth={10}
                            progress={streakSavers}
                            maxProgress={7}
                            streakNumber={currentStreak}
                        />
                    </View>
                </View>

                {/* Time Saved Card */}
                <View style={styles.savedCard}>
                    <Text style={styles.savedNumber}>{totalSaved}</Text>
                    <Text style={styles.savedLabel}>minutes saved today</Text>
                </View>

                {/* Recurring Goals */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recurring Goals</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('GoalsSettings')}>
                            <Text style={styles.editButton}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    {recurringGoals.map((goal) => {
                        if (goal.type === 'app') {
                            const progress = (goal.used / goal.limit) * 100;
                            const isOnTrack = goal.used <= goal.limit;

                            return (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={styles.goalCard}
                                    onPress={() => openTimeModal(goal)}
                                >
                                    <View style={styles.goalHeader}>
                                        <Text style={styles.goalName}>{goal.name}</Text>
                                        <Text style={[styles.goalTime, !isOnTrack && styles.overLimit]}>
                                            {goal.used}/{goal.limit} min
                                        </Text>
                                    </View>

                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${Math.min(progress, 100)}%`,
                                                    backgroundColor: isOnTrack ? goal.color : '#ef4444'
                                                }
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.goalFooter}>
                                        <Text style={styles.goalStatus}>
                                            {isOnTrack ? '✓ On track' : '⚠ Over limit'}
                                        </Text>
                                        <Text style={styles.tapHint}>Tap to log time</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        } else {
                            return (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={styles.goalCard}
                                    onPress={() => updateRecurringGoal(goal.id, { completed: !goal.completed })}
                                >
                                    <View style={styles.habitRow}>
                                        <Text style={styles.goalName}>{goal.name}</Text>
                                        <View style={[styles.checkbox, goal.completed && styles.checkboxChecked]}>
                                            {goal.completed && <Text style={styles.checkmark}>✓</Text>}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }
                    })}
                </View>

                {/* Daily Intentions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Intentions</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(true)}>
                            <Text style={styles.editButton}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {dailyIntentions.length === 0 ? (
                        <TouchableOpacity
                            style={styles.emptyCard}
                            onPress={() => setShowAddModal(true)}
                        >
                            <Text style={styles.emptyText}>+ Set your intentions for today</Text>
                        </TouchableOpacity>
                    ) : (
                        dailyIntentions.map((intention) => (
                            <View key={intention.id} style={styles.intentionCard}>
                                <Text style={[
                                    styles.intentionText,
                                    intention.completed && styles.intentionCompleted
                                ]}>
                                    {intention.completed ? '✓' : '○'} {intention.text}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {showEveningReview && (
                        <TouchableOpacity
                            style={[styles.primaryButton, styles.glowButton]}
                            onPress={() => navigation.navigate('EveningReview')}
                        >
                            <Text style={styles.primaryButtonText}>✨ Recap My Day</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Settings Link */}
                <TouchableOpacity
                    style={styles.settingsLink}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Text style={styles.settingsLinkText}>Settings</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Add Intention Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <TouchableWithoutFeedback onPress={() => {
                    Keyboard.dismiss();
                    setTimeout(closeModal, 100);
                }}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                style={styles.modalContent}
                            >
                                {/* Swipe indicator */}
                                <View style={styles.swipeIndicator} />

                                {/* Close X button */}
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setTimeout(closeModal, 100);
                                    }}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <Text style={styles.modalTitle}>Add Daily Intention</Text>
                                    <Text style={styles.modalSubtitle}>
                                        What's one thing you want to accomplish today?
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        value={intentionText}
                                        onChangeText={setIntentionText}
                                        placeholder="e.g., Call mom, Read 30 pages, Cook a healthy dinner"
                                        placeholderTextColor="#64748b"
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                        multiline
                                        numberOfLines={3}
                                    />

                                    {/* Buttons */}
                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.cancelButton]}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setTimeout(closeModal, 150);
                                            }}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.saveButton]}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setTimeout(addIntention, 150);
                                            }}
                                        >
                                            <Text style={styles.saveButtonText}>Add Intention</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </KeyboardAvoidingView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Log Time Modal */}
            <Modal
                visible={showTimeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={closeTimeModal}
            >
                <TouchableWithoutFeedback onPress={() => {
                    Keyboard.dismiss();
                    setTimeout(closeTimeModal, 100);
                }}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                style={styles.modalContent}
                            >
                                <View style={styles.swipeIndicator} />

                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setTimeout(closeTimeModal, 100);
                                    }}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <Text style={styles.modalTitle}>
                                        Log {selectedGoal?.name} Time
                                    </Text>
                                    <Text style={styles.modalSubtitle}>
                                        How many minutes have you used today?
                                    </Text>

                                    <View style={styles.timeInputContainer}>
                                        <TextInput
                                            style={styles.timeInputField}
                                            value={timeInput}
                                            onChangeText={setTimeInput}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor="#64748b"
                                        />
                                        <Text style={styles.timeUnit}>minutes</Text>
                                    </View>

                                    {/* Quick add buttons */}
                                    <View style={styles.quickAddRow}>
                                        <TouchableOpacity
                                            style={styles.quickAddButton}
                                            onPress={() => addTime(5)}
                                        >
                                            <Text style={styles.quickAddText}>+5</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickAddButton}
                                            onPress={() => addTime(10)}
                                        >
                                            <Text style={styles.quickAddText}>+10</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickAddButton}
                                            onPress={() => addTime(15)}
                                        >
                                            <Text style={styles.quickAddText}>+15</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quickAddButton}
                                            onPress={() => addTime(30)}
                                        >
                                            <Text style={styles.quickAddText}>+30</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {selectedGoal && (
                                        <Text style={styles.limitReminder}>
                                            Daily limit: {selectedGoal.limit} minutes
                                        </Text>
                                    )}

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.cancelButton]}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setTimeout(closeTimeModal, 150);
                                            }}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.saveButton]}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setTimeout(saveTime, 150);
                                            }}
                                        >
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </KeyboardAvoidingView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 16,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    date: {
        fontSize: 18,
        color: '#0ab88fff',
        marginBottom: 4,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },

    savedCard: {
        backgroundColor: '#1e293b',
        marginHorizontal: 24,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 32,
    },
    savedNumber: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#22c55e',
    },
    savedLabel: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
    },
    editButton: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '600',
    },
    goalCard: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    goalName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    goalTime: {
        fontSize: 16,
        color: '#94a3b8',
    },
    overLimit: {
        color: '#ef4444',
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#334155',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    goalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    goalStatus: {
        fontSize: 14,
        color: '#64748b',
    },
    tapHint: {
        fontSize: 12,
        color: '#3b82f6',
    },
    habitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    intentionCard: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
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
        borderWidth: 2,
        borderColor: '#334155',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
    },
    actionButtons: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    settingsLink: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingBottom: 32,
    },
    settingsLinkText: {
        fontSize: 16,
        color: '#64748b',
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    glowButton: {
        backgroundColor: '#8b5cf6',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    swipeIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#64748b',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#334155',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
        marginBottom: 24,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    timeInputField: {
        backgroundColor: '#334155',
        borderRadius: 8,
        padding: 16,
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        width: 140,
    },
    timeUnit: {
        fontSize: 18,
        color: '#94a3b8',
        marginLeft: 12,
    },
    quickAddRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    quickAddButton: {
        backgroundColor: '#334155',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    quickAddText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
    limitReminder: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#334155',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});
