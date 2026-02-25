import React, { useEffect, useState, useMemo } from 'react';
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
  Keyboard,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { MAX_STREAK_SAVERS } from '../constants/limits';
import CircularProgress from '../components/CircularProgress';
import { AppGoal } from '../types';
import { HomeScreenProps } from '../types/navigation';

export default function HomeScreen({ navigation }: HomeScreenProps) {
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
    startNewDay,
  } = useApp();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [intentionText, setIntentionText] = useState('');

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<AppGoal | null>(null);
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    if (isNewDay()) {
      startNewDay().then(() => {
        navigation.navigate('MorningCheckIn');
      });
    }
  }, []);

  const addIntention = () => {
    if (!intentionText.trim()) return;
    addDailyIntention(intentionText);
    setIntentionText('');
    setShowAddModal(false);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setIntentionText('');
  };

  const openTimeModal = (goal: AppGoal) => {
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
        completed: minutes <= selectedGoal.limit,
      });
    }
    closeTimeModal();
  };

  const addTime = (minutes: number) => {
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
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.greeting}>Stay focused 💪</Text>
          </View>

          <View style={styles.headerRight}>
            <CircularProgress
              size={100}
              strokeWidth={10}
              progress={streakSavers}
              maxProgress={MAX_STREAK_SAVERS}
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
              const appGoal = goal as AppGoal;
              const progress = (appGoal.used / appGoal.limit) * 100;
              const isOnTrack = appGoal.used <= appGoal.limit;

              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => openTimeModal(appGoal)}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={[styles.goalTime, !isOnTrack && styles.overLimit]}>
                      {appGoal.used}/{appGoal.limit} min
                    </Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(progress, 100)}%` as `${number}%`,
                          backgroundColor: isOnTrack ? appGoal.color : theme.error,
                        },
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
            <TouchableOpacity style={styles.emptyCard} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyText}>+ Set your intentions for today</Text>
            </TouchableOpacity>
          ) : (
            dailyIntentions.map((intention) => (
              <View key={intention.id} style={styles.intentionCard}>
                <Text style={[styles.intentionText, intention.completed && styles.intentionCompleted]}>
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.swipeIndicator} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Add Daily Intention</Text>
              <Text style={styles.modalSubtitle}>
                What's one thing you want to accomplish today?
              </Text>

              <TextInput
                style={styles.input}
                value={intentionText}
                onChangeText={setIntentionText}
                placeholder="e.g., Call mom, Read 30 pages, Cook a healthy dinner"
                placeholderTextColor={theme.textTertiary}
                returnKeyType="done"
                blurOnSubmit={true}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={addIntention}
                >
                  <Text style={styles.saveButtonText}>Add Intention</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Time Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTimeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={closeTimeModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.swipeIndicator} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeTimeModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Log {selectedGoal?.name} Time</Text>
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
                  placeholderTextColor={theme.textTertiary}
                />
                <Text style={styles.timeUnit}>minutes</Text>
              </View>

              <View style={styles.quickAddRow}>
                {[5, 10, 15, 30].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={styles.quickAddButton}
                    onPress={() => addTime(mins)}
                  >
                    <Text style={styles.quickAddText}>+{mins}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedGoal && (
                <Text style={styles.limitReminder}>
                  Daily limit: {selectedGoal.limit} minutes
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeTimeModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveTime}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      paddingTop: 16,
    },
    headerLeft: { flex: 1 },
    headerRight: { alignItems: 'flex-end' },
    date: { fontSize: 18, color: theme.accent, marginBottom: 4 },
    greeting: { fontSize: 28, fontWeight: 'bold', color: theme.textPrimary },
    savedCard: {
      backgroundColor: theme.surface,
      marginHorizontal: 24,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 32,
    },
    savedNumber: { fontSize: 56, fontWeight: 'bold', color: theme.success },
    savedLabel: { fontSize: 16, color: theme.textSecondary, marginTop: 4 },
    section: { paddingHorizontal: 24, marginBottom: 32 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary },
    editButton: { fontSize: 16, color: theme.accent, fontWeight: '600' },
    goalCard: { backgroundColor: theme.surface, padding: 20, borderRadius: 12, marginBottom: 12 },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    goalName: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
    goalTime: { fontSize: 16, color: theme.textSecondary },
    overLimit: { color: theme.error, fontWeight: '600' },
    progressBarBg: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBarFill: { height: '100%', borderRadius: 4 },
    goalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    goalStatus: { fontSize: 14, color: theme.textTertiary },
    tapHint: { fontSize: 12, color: theme.accent },
    habitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.textTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: { backgroundColor: theme.success, borderColor: theme.success },
    checkmark: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
    intentionCard: { backgroundColor: theme.surface, padding: 16, borderRadius: 12, marginBottom: 8 },
    intentionText: { fontSize: 16, color: theme.textPrimary },
    intentionCompleted: { color: theme.textSecondary, textDecorationLine: 'line-through' },
    emptyCard: {
      backgroundColor: theme.surface,
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyText: { fontSize: 16, color: theme.textTertiary },
    actionButtons: { paddingHorizontal: 24, paddingBottom: 16 },
    settingsLink: { alignItems: 'center', paddingVertical: 16, paddingBottom: 32 },
    settingsLinkText: { fontSize: 16, color: theme.textSecondary, fontWeight: '600' },
    primaryButton: { backgroundColor: theme.accent, padding: 16, borderRadius: 12, alignItems: 'center' },
    glowButton: {
      backgroundColor: theme.purple,
      shadowColor: theme.purple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryButtonText: { fontSize: 18, fontWeight: '600', color: '#ffffff' },
    modalOverlay: { flex: 1, backgroundColor: theme.modalOverlay, justifyContent: 'flex-end' },
    modalBackdrop: { flex: 1 },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      padding: 24,
      paddingBottom: 40,
      marginHorizontal: 12,
      marginBottom: 12,
    },
    swipeIndicator: {
      width: 40,
      height: 4,
      backgroundColor: theme.textTertiary,
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
      backgroundColor: theme.closeButtonBg,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    closeButtonText: { fontSize: 20, color: theme.textSecondary, fontWeight: '600' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 8 },
    modalSubtitle: { fontSize: 16, color: theme.textSecondary, marginBottom: 24 },
    input: {
      backgroundColor: theme.inputBg,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: theme.textPrimary,
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
      backgroundColor: theme.inputBg,
      borderRadius: 8,
      padding: 16,
      fontSize: 48,
      fontWeight: 'bold',
      color: theme.textPrimary,
      textAlign: 'center',
      width: 140,
    },
    timeUnit: { fontSize: 18, color: theme.textSecondary, marginLeft: 12 },
    quickAddRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
    quickAddButton: {
      backgroundColor: theme.border,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    quickAddText: { fontSize: 16, fontWeight: '600', color: theme.accent },
    limitReminder: { fontSize: 14, color: theme.textTertiary, textAlign: 'center', marginBottom: 24 },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: theme.border },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
    saveButton: { backgroundColor: theme.accent },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  });
