import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    Switch,
} from 'react-native';
import { useApp } from '../context/AppContext';
import {
    requestNotificationPermissions,
    scheduleMorningReminder,
    scheduleEveningReminder,
    cancelAllNotifications,
} from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_KEYS = {
    ENABLED: '@timre_notifications_enabled',
    MORNING_HOUR: '@timre_morning_hour',
    MORNING_MINUTE: '@timre_morning_minute',
};

export default function SettingsScreen({ navigation }) {
    const {
        bedtime,
        setBedtime,
        userEmail,
        setUserEmail,
        currentStreak,
        longestStreak,
        resetAllData,
        use24HourFormat,
        setUse24HourFormat,
    } = useApp();

    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showMorningModal, setShowMorningModal] = useState(false);

    // Parse bedtime into components for 12-hour picker
    const parseBedtime = () => {
        const [h, m] = bedtime.split(':').map(n => parseInt(n, 10));
        const isPM = h >= 12;
        const displayHour = h % 12 || 12;
        return { hour: displayHour.toString(), minute: m.toString().padStart(2, '0'), period: isPM ? 'PM' : 'AM' };
    };

    const initialBedtime = parseBedtime();
    const [tempHour, setTempHour] = useState(initialBedtime.hour);
    const [tempMinute, setTempMinute] = useState(initialBedtime.minute);
    const [tempPeriod, setTempPeriod] = useState(initialBedtime.period);

    const [emailInput, setEmailInput] = useState(userEmail);

    // Notification settings
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
    const [morningHour, setMorningHour] = useState('8');
    const [morningMinute, setMorningMinute] = useState('00');
    const [morningPeriod, setMorningPeriod] = useState('AM');

    // Load notification settings on mount
    useEffect(() => {
        loadNotificationSettings();
    }, []);

    const loadNotificationSettings = async () => {
        try {
            const [enabled, hour, minute] = await Promise.all([
                AsyncStorage.getItem(NOTIFICATION_KEYS.ENABLED),
                AsyncStorage.getItem(NOTIFICATION_KEYS.MORNING_HOUR),
                AsyncStorage.getItem(NOTIFICATION_KEYS.MORNING_MINUTE),
            ]);

            if (enabled !== null) setNotificationsEnabled(enabled === 'true');
            if (hour !== null) {
                const h = parseInt(hour, 10);
                const isPM = h >= 12;
                const displayHour = h % 12 || 12;
                setMorningHour(displayHour.toString());
                setMorningPeriod(isPM ? 'PM' : 'AM');
            }
            if (minute !== null) setMorningMinute(minute.padStart(2, '0'));
        } catch (error) {
            // Silently handle error
        }
    };

    const toggleNotifications = async (value) => {
        if (isTogglingNotifications) return;
        setIsTogglingNotifications(true);

        try {
            if (value) {
                const granted = await requestNotificationPermissions();
                if (!granted) {
                    Alert.alert(
                        'Permissions Required',
                        'Please enable notifications in your device settings to receive reminders. On a simulator, notifications may not work.'
                    );
                    setIsTogglingNotifications(false);
                    return;
                }

                // Schedule notifications
                const morningHour24 = convert12To24Hour(parseInt(morningHour, 10), morningPeriod);
                const [bedtimeHour, bedtimeMinute] = bedtime.split(':').map(n => parseInt(n, 10));
                await scheduleMorningReminder(morningHour24, parseInt(morningMinute, 10));
                await scheduleEveningReminder(bedtimeHour, bedtimeMinute);

                setNotificationsEnabled(true);
                await AsyncStorage.setItem(NOTIFICATION_KEYS.ENABLED, 'true');
            } else {
                await cancelAllNotifications();
                setNotificationsEnabled(false);
                await AsyncStorage.setItem(NOTIFICATION_KEYS.ENABLED, 'false');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update notification settings.');
        } finally {
            setIsTogglingNotifications(false);
        }
    };

    const convert12To24Hour = (hour, period) => {
        if (period === 'AM') {
            return hour === 12 ? 0 : hour;
        } else {
            return hour === 12 ? 12 : hour + 12;
        }
    };

    const saveBedtime = async () => {
        let hour24;
        if (use24HourFormat) {
            hour24 = parseInt(tempHour, 10) || 0;
        } else {
            hour24 = convert12To24Hour(parseInt(tempHour, 10) || 12, tempPeriod);
        }
        const minute = (parseInt(tempMinute, 10) || 0).toString().padStart(2, '0');
        const newBedtime = `${hour24.toString().padStart(2, '0')}:${minute}`;
        await setBedtime(newBedtime);
        setShowTimeModal(false);

        // Reschedule evening notification if enabled
        if (notificationsEnabled) {
            await scheduleEveningReminder(hour24, parseInt(minute, 10));
        }
    };

    const saveMorningTime = async () => {
        let hour24;
        if (use24HourFormat) {
            hour24 = parseInt(morningHour, 10) || 0;
        } else {
            hour24 = convert12To24Hour(parseInt(morningHour, 10) || 12, morningPeriod);
        }
        const minute = (parseInt(morningMinute, 10) || 0).toString().padStart(2, '0');

        await AsyncStorage.setItem(NOTIFICATION_KEYS.MORNING_HOUR, hour24.toString());
        await AsyncStorage.setItem(NOTIFICATION_KEYS.MORNING_MINUTE, minute);

        setShowMorningModal(false);

        // Reschedule morning notification if enabled
        if (notificationsEnabled) {
            await scheduleMorningReminder(hour24, parseInt(minute, 10));
        }
    };

    const saveEmail = () => {
        setUserEmail(emailInput.trim());
    };

    const handleResetData = () => {
        Alert.alert(
            'Reset All Data',
            'This will permanently delete all your streaks, goals, and settings. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                        await resetAllData();
                        await cancelAllNotifications();
                        setNotificationsEnabled(false);
                        Alert.alert('Data Reset', 'All data has been cleared.');
                    }
                }
            ]
        );
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        if (use24HourFormat) {
            return `${h.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
    };

    const formatMorningTime = () => {
        if (use24HourFormat) {
            const hour24 = convert12To24Hour(parseInt(morningHour, 10), morningPeriod);
            return `${hour24.toString().padStart(2, '0')}:${morningMinute.padStart(2, '0')}`;
        }
        return `${morningHour}:${morningMinute.padStart(2, '0')} ${morningPeriod}`;
    };

    const openBedtimeModal = () => {
        const parsed = parseBedtime();
        if (use24HourFormat) {
            const [h, m] = bedtime.split(':');
            setTempHour(h);
            setTempMinute(m);
        } else {
            setTempHour(parsed.hour);
            setTempMinute(parsed.minute);
            setTempPeriod(parsed.period);
        }
        setShowTimeModal(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Notifications Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notifications</Text>
                        <Text style={styles.sectionDescription}>
                            Get reminded to check in each morning and complete your evening review.
                        </Text>

                        <View style={styles.settingCard}>
                            <Text style={styles.settingLabel}>Enable Reminders</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                disabled={isTogglingNotifications}
                                trackColor={{ false: '#334155', true: '#3b82f6' }}
                                thumbColor={notificationsEnabled ? '#ffffff' : '#94a3b8'}
                            />
                        </View>

                        {notificationsEnabled && (
                            <TouchableOpacity
                                style={[styles.settingCard, { marginTop: 8 }]}
                                onPress={() => setShowMorningModal(true)}
                            >
                                <Text style={styles.settingLabel}>Morning reminder</Text>
                                <Text style={styles.settingValue}>{formatMorningTime()}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Bedtime Setting */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bedtime</Text>
                        <Text style={styles.sectionDescription}>
                            Evening review becomes available 1 hour before your bedtime.
                        </Text>
                        <TouchableOpacity
                            style={styles.settingCard}
                            onPress={openBedtimeModal}
                        >
                            <Text style={styles.settingLabel}>Your bedtime</Text>
                            <Text style={styles.settingValue}>{formatTime(bedtime)}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Time Format Setting */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Time Format</Text>
                        <View style={styles.settingCard}>
                            <Text style={styles.settingLabel}>Use 24-hour format</Text>
                            <Switch
                                value={use24HourFormat}
                                onValueChange={setUse24HourFormat}
                                trackColor={{ false: '#334155', true: '#3b82f6' }}
                                thumbColor={use24HourFormat ? '#ffffff' : '#94a3b8'}
                            />
                        </View>
                    </View>

                    {/* Email Setting */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        <Text style={styles.sectionDescription}>
                            Your email for future sync and backup features.
                        </Text>
                        <View style={styles.inputCard}>
                            <TextInput
                                style={styles.input}
                                value={emailInput}
                                onChangeText={setEmailInput}
                                onBlur={saveEmail}
                                placeholder="Enter your email"
                                placeholderTextColor="#64748b"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Stats Display */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Stats</Text>
                        <View style={styles.statsCard}>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Current Streak</Text>
                                <Text style={styles.statValue}>{currentStreak} days</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Longest Streak</Text>
                                <Text style={styles.statValue}>{longestStreak} days</Text>
                            </View>
                        </View>
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Danger Zone</Text>
                        <TouchableOpacity
                            style={styles.dangerButton}
                            onPress={handleResetData}
                        >
                            <Text style={styles.dangerButtonText}>Reset All Data</Text>
                        </TouchableOpacity>
                    </View>

                    {/* App Version */}
                    <View style={styles.footer}>
                        <Text style={styles.versionText}>Timre v1.0.0</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bedtime Picker Modal */}
            <Modal
                visible={showTimeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTimeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set Bedtime</Text>

                        {use24HourFormat ? (
                            // 24-hour format picker
                            <View style={styles.timePickerContainer}>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Hour</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={tempHour}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 23)) {
                                                setTempHour(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="22"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <Text style={styles.timeSeparator}>:</Text>

                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Minute</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={tempMinute}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) {
                                                setTempMinute(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="00"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>
                        ) : (
                            // 12-hour format picker with AM/PM
                            <View style={styles.timePickerContainer12}>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Hour</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={tempHour}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 12)) {
                                                setTempHour(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="10"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <Text style={styles.timeSeparator}>:</Text>

                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Minute</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={tempMinute}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) {
                                                setTempMinute(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="00"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <View style={styles.periodSelector}>
                                    <TouchableOpacity
                                        style={[styles.periodButton, tempPeriod === 'AM' && styles.periodButtonActive]}
                                        onPress={() => setTempPeriod('AM')}
                                    >
                                        <Text style={[styles.periodText, tempPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.periodButton, tempPeriod === 'PM' && styles.periodButtonActive]}
                                        onPress={() => setTempPeriod('PM')}
                                    >
                                        <Text style={[styles.periodText, tempPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text style={styles.timeHint}>
                            {use24HourFormat ? 'Use 24-hour format (e.g., 22:00 for 10 PM)' : 'Select your usual bedtime'}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    const parsed = parseBedtime();
                                    setTempHour(parsed.hour);
                                    setTempMinute(parsed.minute);
                                    setTempPeriod(parsed.period);
                                    setShowTimeModal(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={saveBedtime}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Morning Time Picker Modal */}
            <Modal
                visible={showMorningModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMorningModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Morning Reminder</Text>

                        {use24HourFormat ? (
                            // 24-hour format picker
                            <View style={styles.timePickerContainer}>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Hour</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={morningHour}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 23)) {
                                                setMorningHour(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="8"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <Text style={styles.timeSeparator}>:</Text>

                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Minute</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={morningMinute}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) {
                                                setMorningMinute(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="00"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>
                            </View>
                        ) : (
                            // 12-hour format picker with AM/PM
                            <View style={styles.timePickerContainer12}>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Hour</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={morningHour}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 12)) {
                                                setMorningHour(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="8"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <Text style={styles.timeSeparator}>:</Text>

                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Minute</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={morningMinute}
                                        onChangeText={(text) => {
                                            const num = text.replace(/[^0-9]/g, '');
                                            if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) {
                                                setMorningMinute(num);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        placeholder="00"
                                        placeholderTextColor="#64748b"
                                    />
                                </View>

                                <View style={styles.periodSelector}>
                                    <TouchableOpacity
                                        style={[styles.periodButton, morningPeriod === 'AM' && styles.periodButtonActive]}
                                        onPress={() => setMorningPeriod('AM')}
                                    >
                                        <Text style={[styles.periodText, morningPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.periodButton, morningPeriod === 'PM' && styles.periodButtonActive]}
                                        onPress={() => setMorningPeriod('PM')}
                                    >
                                        <Text style={[styles.periodText, morningPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text style={styles.timeHint}>When should we remind you to start your day?</Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowMorningModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={saveMorningTime}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 16,
        lineHeight: 20,
    },
    settingCard: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        color: '#ffffff',
    },
    settingValue: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '600',
    },
    inputCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        overflow: 'hidden',
    },
    input: {
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
    },
    statsCard: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    statLabel: {
        fontSize: 16,
        color: '#94a3b8',
    },
    statValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    dangerButton: {
        backgroundColor: '#7f1d1d',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fca5a5',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    versionText: {
        fontSize: 14,
        color: '#64748b',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 24,
        textAlign: 'center',
    },
    timePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    timePickerContainer12: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    timeInputGroup: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 8,
    },
    timeInput: {
        backgroundColor: '#334155',
        borderRadius: 8,
        padding: 16,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        width: 80,
    },
    timeSeparator: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginHorizontal: 8,
        marginTop: 20,
    },
    periodSelector: {
        marginLeft: 12,
        marginTop: 20,
    },
    periodButton: {
        backgroundColor: '#334155',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 4,
    },
    periodButtonActive: {
        backgroundColor: '#3b82f6',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
    periodTextActive: {
        color: '#ffffff',
    },
    timeHint: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
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
