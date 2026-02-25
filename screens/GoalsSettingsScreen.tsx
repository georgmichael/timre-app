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
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors, GOAL_COLOR_PALETTE } from '../constants/colors';
import { DEFAULT_TIME_LIMIT_MINUTES, MAX_GOAL_NAME_LENGTH, MAX_TIME_MINUTES } from '../constants/limits';
import { RecurringGoal, AppGoal } from '../types';
import { GoalsSettingsScreenProps } from '../types/navigation';

type GoalType = 'app' | 'habit';

export default function GoalsSettingsScreen({ navigation: _navigation }: GoalsSettingsScreenProps) {
  const { recurringGoals, addRecurringGoal, deleteRecurringGoal, updateRecurringGoal } = useApp();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('app');
  const [goalName, setGoalName] = useState('');
  const [goalLimit, setGoalLimit] = useState(DEFAULT_TIME_LIMIT_MINUTES.toString());
  const [goalColor, setGoalColor] = useState<string>(GOAL_COLOR_PALETTE[0]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<RecurringGoal | null>(null);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState(DEFAULT_TIME_LIMIT_MINUTES.toString());
  const [editColor, setEditColor] = useState<string>(GOAL_COLOR_PALETTE[0]);

  const addGoal = () => {
    const trimmedName = goalName.trim().slice(0, MAX_GOAL_NAME_LENGTH);
    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter a name for your goal');
      return;
    }

    const newGoal = {
      type: goalType,
      name: trimmedName,
      completed: false,
      color: goalColor,
      ...(goalType === 'app' && {
        limit: Math.min(parseInt(goalLimit, 10) || DEFAULT_TIME_LIMIT_MINUTES, MAX_TIME_MINUTES),
        used: 0,
      }),
    } as Omit<RecurringGoal, 'id'>;

    addRecurringGoal(newGoal);
    setGoalName('');
    setGoalLimit(DEFAULT_TIME_LIMIT_MINUTES.toString());
    setGoalColor(GOAL_COLOR_PALETTE[0]);
    setShowAddModal(false);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setGoalName('');
    setGoalLimit(DEFAULT_TIME_LIMIT_MINUTES.toString());
    setGoalColor(GOAL_COLOR_PALETTE[0]);
    setGoalType('app');
  };

  const openEditModal = (goal: RecurringGoal) => {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditColor(goal.color ?? GOAL_COLOR_PALETTE[0]);
    setEditLimit(goal.type === 'app' ? goal.limit.toString() : DEFAULT_TIME_LIMIT_MINUTES.toString());
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    const trimmedName = editName.trim().slice(0, MAX_GOAL_NAME_LENGTH);
    if (!editingGoal || !trimmedName) {
      Alert.alert('Missing Name', 'Please enter a name for your goal');
      return;
    }

    const updates: Partial<AppGoal> | Partial<RecurringGoal> = {
      name: trimmedName,
      color: editColor,
    };

    if (editingGoal.type === 'app') {
      (updates as Partial<AppGoal>).limit =
        Math.min(parseInt(editLimit, 10) || DEFAULT_TIME_LIMIT_MINUTES, MAX_TIME_MINUTES);
    }

    await updateRecurringGoal(editingGoal.id, updates);
    closeEditModal();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingGoal(null);
    setEditName('');
    setEditLimit(DEFAULT_TIME_LIMIT_MINUTES.toString());
    setEditColor(GOAL_COLOR_PALETTE[0]);
  };

  const ColorPicker = ({
    selectedColor,
    onSelect,
  }: {
    selectedColor: string;
    onSelect: (c: string) => void;
  }) => (
    <View style={styles.colorPickerRow}>
      {GOAL_COLOR_PALETTE.map((color) => (
        <TouchableOpacity
          key={color}
          style={[
            styles.colorSwatch,
            { backgroundColor: color },
            selectedColor === color && styles.colorSwatchSelected,
          ]}
          onPress={() => onSelect(color)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Set up your recurring goals. These will track automatically every day.
          </Text>

          {/* App Limits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Time Limits</Text>
            {recurringGoals
              .filter((g): g is AppGoal => g.type === 'app')
              .map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={[styles.goalColorDot, { backgroundColor: goal.color }]} />
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalDetail}>{goal.limit} min/day</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openEditModal(goal)}
                    style={styles.editButton}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteRecurringGoal(goal.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>

          {/* Habits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Habits</Text>
            {recurringGoals
              .filter((g) => g.type === 'habit')
              .map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={[styles.goalColorDot, { backgroundColor: goal.color ?? theme.accent }]} />
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openEditModal(goal)}
                    style={styles.editButton}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteRecurringGoal(goal.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ Add Recurring Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddModal}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setTimeout(closeAddModal, 100); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
              >
                <View style={styles.swipeIndicator} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => { Keyboard.dismiss(); setTimeout(closeAddModal, 100); }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalTitle}>Add Recurring Goal</Text>

                  <View style={styles.typeSelector}>
                    {(['app', 'habit'] as GoalType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeButton, goalType === type && styles.typeButtonActive]}
                        onPress={() => setGoalType(type)}
                      >
                        <Text style={[styles.typeButtonText, goalType === type && styles.typeButtonTextActive]}>
                          {type === 'app' ? 'App Limit' : 'Habit'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>
                    {goalType === 'app' ? 'App Name' : 'Habit Description'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={goalName}
                    onChangeText={setGoalName}
                    placeholder={goalType === 'app' ? 'e.g., Instagram' : 'e.g., Exercise 30 min'}
                    placeholderTextColor={theme.textTertiary}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />

                  {goalType === 'app' && (
                    <>
                      <Text style={styles.inputLabel}>Daily Time Limit (minutes)</Text>
                      <TextInput
                        style={styles.input}
                        value={goalLimit}
                        onChangeText={setGoalLimit}
                        placeholder="30"
                        placeholderTextColor={theme.textTertiary}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>Color</Text>
                  <ColorPicker selectedColor={goalColor} onSelect={setGoalColor} />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => { Keyboard.dismiss(); setTimeout(closeAddModal, 150); }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={() => { Keyboard.dismiss(); setTimeout(addGoal, 150); }}
                    >
                      <Text style={styles.saveButtonText}>Add Goal</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setTimeout(closeEditModal, 100); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
              >
                <View style={styles.swipeIndicator} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => { Keyboard.dismiss(); setTimeout(closeEditModal, 100); }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalTitle}>Edit Goal</Text>

                  <Text style={styles.inputLabel}>
                    {editingGoal?.type === 'app' ? 'App Name' : 'Habit Description'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={editingGoal?.type === 'app' ? 'e.g., Instagram' : 'e.g., Exercise 30 min'}
                    placeholderTextColor={theme.textTertiary}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />

                  {editingGoal?.type === 'app' && (
                    <>
                      <Text style={styles.inputLabel}>Daily Time Limit (minutes)</Text>
                      <TextInput
                        style={styles.input}
                        value={editLimit}
                        onChangeText={setEditLimit}
                        placeholder="30"
                        placeholderTextColor={theme.textTertiary}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                    </>
                  )}

                  <Text style={styles.inputLabel}>Color</Text>
                  <ColorPicker selectedColor={editColor} onSelect={setEditColor} />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => { Keyboard.dismiss(); setTimeout(closeEditModal, 150); }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={() => { Keyboard.dismiss(); setTimeout(saveEdit, 150); }}
                    >
                      <Text style={styles.saveButtonText}>Save Changes</Text>
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
    description: { fontSize: 16, color: theme.textSecondary, marginBottom: 32, lineHeight: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 16 },
    goalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    goalColorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    goalInfo: { flex: 1 },
    goalName: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
    goalDetail: { fontSize: 14, color: theme.textSecondary },
    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.inputBg,
      marginRight: 8,
    },
    editText: { fontSize: 14, fontWeight: '600', color: theme.accent },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteText: { fontSize: 18, color: theme.error },
    addButton: { backgroundColor: theme.accent, padding: 16, borderRadius: 12, alignItems: 'center' },
    addButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
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
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 24 },
    typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.border,
      alignItems: 'center',
    },
    typeButtonActive: { backgroundColor: theme.accent },
    typeButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
    typeButtonTextActive: { color: '#ffffff' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
    input: {
      backgroundColor: theme.inputBg,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: theme.textPrimary,
      marginBottom: 20,
    },
    colorPickerRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
    colorSwatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    colorSwatchSelected: {
      borderWidth: 3,
      borderColor: '#ffffff',
    },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: theme.border },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
    saveButton: { backgroundColor: theme.accent },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  });
