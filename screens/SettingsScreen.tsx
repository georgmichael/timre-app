import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import Toggle from '../components/Toggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { NOTIFICATION_KEYS } from '../constants/storage';
import { ThemeMode } from '../types';
import { SettingsScreenProps } from '../types/navigation';
import {
  requestNotificationPermissions,
  scheduleMorningReminder,
  scheduleEveningReminder,
  cancelAllNotifications,
} from '../utils/notifications';

type Period = 'AM' | 'PM';

export default function SettingsScreen({ navigation: _navigation }: SettingsScreenProps) {
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
  const { theme, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMorningModal, setShowMorningModal] = useState(false);

  const parseBedtime = () => {
    const [h, m] = bedtime.split(':').map(n => parseInt(n, 10));
    const isPM = h >= 12;
    const displayHour = h % 12 || 12;
    return {
      hour: displayHour.toString(),
      minute: m.toString().padStart(2, '0'),
      period: (isPM ? 'PM' : 'AM') as Period,
    };
  };

  const initialBedtime = parseBedtime();
  const [tempHour, setTempHour] = useState(initialBedtime.hour);
  const [tempMinute, setTempMinute] = useState(initialBedtime.minute);
  const [tempPeriod, setTempPeriod] = useState<Period>(initialBedtime.period);

  const [emailInput, setEmailInput] = useState(userEmail);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [morningHour, setMorningHour] = useState('8');
  const [morningMinute, setMorningMinute] = useState('00');
  const [morningPeriod, setMorningPeriod] = useState<Period>('AM');

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
    } catch {
      // Silently handle error
    }
  };

  const convert12To24Hour = (hour: number, period: Period): number => {
    if (period === 'AM') return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  };

  const toggleNotifications = async (value: boolean) => {
    if (isTogglingNotifications) return;
    setIsTogglingNotifications(true);

    try {
      if (value) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to receive reminders. On a simulator, notifications may not work.',
          );
          setIsTogglingNotifications(false);
          return;
        }

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
    } catch {
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  const saveBedtime = async () => {
    let hour24: number;
    if (use24HourFormat) {
      hour24 = parseInt(tempHour, 10) || 0;
    } else {
      hour24 = convert12To24Hour(parseInt(tempHour, 10) || 12, tempPeriod);
    }
    const minute = (parseInt(tempMinute, 10) || 0).toString().padStart(2, '0');
    const newBedtime = `${hour24.toString().padStart(2, '0')}:${minute}`;
    await setBedtime(newBedtime);
    setShowTimeModal(false);

    if (notificationsEnabled) {
      await scheduleEveningReminder(hour24, parseInt(minute, 10));
    }
  };

  const saveMorningTime = async () => {
    let hour24: number;
    if (use24HourFormat) {
      hour24 = parseInt(morningHour, 10) || 0;
    } else {
      hour24 = convert12To24Hour(parseInt(morningHour, 10) || 12, morningPeriod);
    }
    const minute = (parseInt(morningMinute, 10) || 0).toString().padStart(2, '0');

    await AsyncStorage.setItem(NOTIFICATION_KEYS.MORNING_HOUR, hour24.toString());
    await AsyncStorage.setItem(NOTIFICATION_KEYS.MORNING_MINUTE, minute);
    setShowMorningModal(false);

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
          },
        },
      ],
    );
  };

  const formatTime = (time: string) => {
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

  const THEME_MODES: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <Text style={styles.sectionDescription}>
              Choose a theme or follow your device's system setting.
            </Text>
            <View style={styles.typeSelector}>
              {THEME_MODES.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.typeButton, themeMode === value && styles.typeButtonActive]}
                  onPress={() => setThemeMode(value)}
                >
                  <Text style={[styles.typeButtonText, themeMode === value && styles.typeButtonTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Text style={styles.sectionDescription}>
              Get reminded to check in each morning and complete your evening review.
            </Text>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Enable Reminders</Text>
              <Toggle
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                disabled={isTogglingNotifications}
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
            <TouchableOpacity style={styles.settingCard} onPress={openBedtimeModal}>
              <Text style={styles.settingLabel}>Your bedtime</Text>
              <Text style={styles.settingValue}>{formatTime(bedtime)}</Text>
            </TouchableOpacity>
          </View>

          {/* Time Format Setting */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Format</Text>
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Use 24-hour format</Text>
              <Toggle
                value={use24HourFormat}
                onValueChange={setUse24HourFormat}
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
                placeholderTextColor={theme.textTertiary}
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
            <TouchableOpacity style={styles.dangerButton} onPress={handleResetData}>
              <Text style={styles.dangerButtonText}>Reset All Data</Text>
            </TouchableOpacity>
          </View>

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
              <View style={styles.timePickerContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempHour}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 23)) setTempHour(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="22"
                    placeholderTextColor={theme.textTertiary}
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
                      if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) setTempMinute(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.timePickerContainer12}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={tempHour}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      if (num === '' || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 12)) setTempHour(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="10"
                    placeholderTextColor={theme.textTertiary}
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
                      if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) setTempMinute(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
                <View style={styles.periodSelector}>
                  {(['AM', 'PM'] as Period[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.periodButton, tempPeriod === p && styles.periodButtonActive]}
                      onPress={() => setTempPeriod(p)}
                    >
                      <Text style={[styles.periodText, tempPeriod === p && styles.periodTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
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
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveBedtime}>
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
              <View style={styles.timePickerContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={morningHour}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 23)) setMorningHour(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="8"
                    placeholderTextColor={theme.textTertiary}
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
                      if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) setMorningMinute(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.timePickerContainer12}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={morningHour}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      if (num === '' || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 12)) setMorningHour(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="8"
                    placeholderTextColor={theme.textTertiary}
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
                      if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) setMorningMinute(num);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
                <View style={styles.periodSelector}>
                  {(['AM', 'PM'] as Period[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.periodButton, morningPeriod === p && styles.periodButtonActive]}
                      onPress={() => setMorningPeriod(p)}
                    >
                      <Text style={[styles.periodText, morningPeriod === p && styles.periodTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
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
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveMorningTime}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1 },
    content: { padding: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginBottom: 8 },
    sectionDescription: { fontSize: 14, color: theme.textSecondary, marginBottom: 16, lineHeight: 20 },
    typeSelector: { flexDirection: 'row', gap: 8 },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.border,
      alignItems: 'center',
    },
    typeButtonActive: { backgroundColor: theme.accent },
    typeButtonText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
    typeButtonTextActive: { color: '#ffffff' },
    settingCard: {
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingLabel: { fontSize: 16, color: theme.textPrimary },
    settingValue: { fontSize: 16, color: theme.accent, fontWeight: '600' },
    inputCard: { backgroundColor: theme.surface, borderRadius: 12, overflow: 'hidden' },
    input: { padding: 16, fontSize: 16, color: theme.textPrimary },
    statsCard: { backgroundColor: theme.surface, padding: 16, borderRadius: 12 },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    statLabel: { fontSize: 16, color: theme.textSecondary },
    statValue: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },
    dangerButton: {
      backgroundColor: theme.streakWarningBg,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    dangerButtonText: { fontSize: 16, fontWeight: '600', color: theme.streakWarningText },
    footer: { alignItems: 'center', paddingVertical: 24 },
    versionText: { fontSize: 14, color: theme.textTertiary },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 24, textAlign: 'center' },
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
    timeInputGroup: { alignItems: 'center' },
    timeLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 8 },
    timeInput: {
      backgroundColor: theme.inputBg,
      borderRadius: 8,
      padding: 16,
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.textPrimary,
      textAlign: 'center',
      width: 80,
    },
    timeSeparator: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginHorizontal: 8,
      marginTop: 20,
    },
    periodSelector: { marginLeft: 12, marginTop: 20 },
    periodButton: {
      backgroundColor: theme.border,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginBottom: 4,
    },
    periodButtonActive: { backgroundColor: theme.accent },
    periodText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
    periodTextActive: { color: '#ffffff' },
    timeHint: { fontSize: 12, color: theme.textTertiary, textAlign: 'center', marginBottom: 24 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: theme.border },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
    saveButton: { backgroundColor: theme.accent },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  });
