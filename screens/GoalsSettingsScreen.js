import React, { useState } from 'react';
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
    Alert
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function GoalsSettingsScreen({ navigation }) {
    const {
        recurringGoals,
        addRecurringGoal,
        deleteRecurringGoal,
    } = useApp();

    const [showAddModal, setShowAddModal] = useState(false);
    const [goalType, setGoalType] = useState('app');
    const [goalName, setGoalName] = useState('');
    const [goalLimit, setGoalLimit] = useState('30');

    const addGoal = () => {
        if (!goalName.trim()) {
            Alert.alert('Missing Name', 'Please enter a name for your goal');
            return;
        }

        const newGoal = {
            type: goalType,
            name: goalName.trim(),
            completed: false,
            ...(goalType === 'app' && {
                limit: parseInt(goalLimit) || 30,
                used: 0,
                color: '#3b82f6'
            })
        };

        addRecurringGoal(newGoal);

        // Reset form and close
        setGoalName('');
        setGoalLimit('30');
        setShowAddModal(false);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setGoalName('');
        setGoalLimit('30');
        setGoalType('app');
    };

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
                            .filter(g => g.type === 'app')
                            .map(goal => (
                                <View key={goal.id} style={styles.goalItem}>
                                    <View style={styles.goalInfo}>
                                        <Text style={styles.goalName}>{goal.name}</Text>
                                        <Text style={styles.goalDetail}>{goal.limit} min/day</Text>
                                    </View>
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
                            .filter(g => g.type === 'habit')
                            .map(goal => (
                                <View key={goal.id} style={styles.goalItem}>
                                    <View style={styles.goalInfo}>
                                        <Text style={styles.goalName}>{goal.name}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => deleteRecurringGoal(goal.id)}
                                        style={styles.deleteButton}
                                    >
                                        <Text style={styles.deleteText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                    </View>

                    {/* Add Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowAddModal(true)}
                    >
                        <Text style={styles.addButtonText}>+ Add Recurring Goal</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Add Goal Modal */}
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
                                    <Text style={styles.modalTitle}>Add Recurring Goal</Text>

                                    {/* Type Selector */}
                                    <View style={styles.typeSelector}>
                                        <TouchableOpacity
                                            style={[styles.typeButton, goalType === 'app' && styles.typeButtonActive]}
                                            onPress={() => setGoalType('app')}
                                        >
                                            <Text style={[styles.typeButtonText, goalType === 'app' && styles.typeButtonTextActive]}>
                                                App Limit
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.typeButton, goalType === 'habit' && styles.typeButtonActive]}
                                            onPress={() => setGoalType('habit')}
                                        >
                                            <Text style={[styles.typeButtonText, goalType === 'habit' && styles.typeButtonTextActive]}>
                                                Habit
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Goal Name Input */}
                                    <Text style={styles.inputLabel}>
                                        {goalType === 'app' ? 'App Name' : 'Habit Description'}
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={goalName}
                                        onChangeText={setGoalName}
                                        placeholder={goalType === 'app' ? 'e.g., Instagram' : 'e.g., Exercise 30 min'}
                                        placeholderTextColor="#64748b"
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                    />

                                    {/* Time Limit (only for apps) */}
                                    {goalType === 'app' && (
                                        <>
                                            <Text style={styles.inputLabel}>Daily Time Limit (minutes)</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={goalLimit}
                                                onChangeText={setGoalLimit}
                                                placeholder="30"
                                                placeholderTextColor="#64748b"
                                                keyboardType="number-pad"
                                                returnKeyType="done"
                                                blurOnSubmit={true}
                                            />
                                        </>
                                    )}

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
                                                setTimeout(addGoal, 150);
                                            }}
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
    description: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 32,
        lineHeight: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    goalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    goalInfo: {
        flex: 1,
    },
    goalName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 4,
    },
    goalDetail: {
        fontSize: 14,
        color: '#94a3b8',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteText: {
        fontSize: 18,
        color: '#ef4444',
    },
    addButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 16,
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
        marginBottom: 24,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#334155',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#3b82f6',
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    typeButtonTextActive: {
        color: '#ffffff',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#334155',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
        marginBottom: 20,
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