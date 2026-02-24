import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { MAX_INTENTIONS } from '../constants/limits';
import { MorningCheckInScreenProps } from '../types/navigation';

export default function MorningCheckInScreen({ navigation }: MorningCheckInScreenProps) {
  const {
    recurringGoals,
    dailyIntentions,
    addDailyIntention,
    deleteDailyIntention,
    setDayStarted,
  } = useApp();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [intentionText, setIntentionText] = useState('');

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

  const startDay = () => {
    setDayStarted(true);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.greeting}>Good morning! ☀️</Text>
          <Text style={styles.description}>
            What do you want to accomplish today? Set 1-3 intentions to make today meaningful.
          </Text>

          <View style={styles.recurringSection}>
            <Text style={styles.sectionTitle}>Your Recurring Goals (Auto-tracking)</Text>
            {recurringGoals.map((goal) => (
              <View key={goal.id} style={styles.recurringGoal}>
                <Text style={styles.recurringText}>
                  {goal.type === 'app' ? '📱' : '🎯'} {goal.name}
                  {goal.type === 'app' && ` < ${goal.limit} min`}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Intentions</Text>

            {dailyIntentions.map((intention) => (
              <View key={intention.id} style={styles.intentionItem}>
                <Text style={styles.intentionText}>{intention.text}</Text>
                <TouchableOpacity
                  onPress={() => deleteDailyIntention(intention.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {dailyIntentions.length < MAX_INTENTIONS && (
              <TouchableOpacity
                style={styles.addIntentionButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addIntentionText}>+ Add intention</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startDay}>
            <Text style={styles.startButtonText}>Start My Day</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setTimeout(closeModal, 100); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
              >
                <View style={styles.swipeIndicator} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => { Keyboard.dismiss(); setTimeout(closeModal, 100); }}
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
                      onPress={() => { Keyboard.dismiss(); setTimeout(closeModal, 150); }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={() => { Keyboard.dismiss(); setTimeout(addIntention, 150); }}
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
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    content: { padding: 24 },
    greeting: { fontSize: 32, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 12 },
    description: { fontSize: 16, color: theme.textSecondary, marginBottom: 32, lineHeight: 24 },
    recurringSection: {
      backgroundColor: theme.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 32,
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 16 },
    recurringGoal: { paddingVertical: 8 },
    recurringText: { fontSize: 16, color: theme.textSecondary },
    section: { marginBottom: 32 },
    intentionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    intentionText: { flex: 1, fontSize: 16, color: theme.textPrimary },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteText: { fontSize: 18, color: theme.error },
    addIntentionButton: {
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    addIntentionText: { fontSize: 16, color: theme.textTertiary },
    startButton: { backgroundColor: theme.success, padding: 18, borderRadius: 12, alignItems: 'center' },
    startButtonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
    modalOverlay: { flex: 1, backgroundColor: theme.modalOverlay, justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      maxHeight: '80%',
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
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: theme.border },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
    saveButton: { backgroundColor: theme.accent },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  });
