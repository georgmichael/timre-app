import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { AppGoal, HabitGoal } from '../types';
import AnimatedBackground from '../components/AnimatedBackground';
import Toggle from '../components/Toggle';
import { NOTIFICATION_KEYS } from '../constants/storage';
import {
  requestNotificationPermissions,
  scheduleMorningReminder,
  scheduleEveningReminder,
  cancelAllNotifications,
} from '../utils/notifications';
import { OnboardingScreenProps } from '../types/navigation';

const TOTAL_SLIDES = 5;

type Period = 'AM' | 'PM';

type SuggestedGoal =
  | { type: 'app'; name: string; limit: number; color: string }
  | { type: 'habit'; name: string; color: string };

const SUGGESTED_GOALS: SuggestedGoal[] = [
  { type: 'app', name: 'Instagram', limit: 30, color: '#e4405f' },
  { type: 'app', name: 'YouTube', limit: 60, color: '#ef4444' },
  { type: 'app', name: 'TikTok', limit: 45, color: '#00f2ea' },
  { type: 'habit', name: 'Meditate', color: '#22c55e' },
  { type: 'habit', name: 'Read', color: '#3b82f6' },
];

const parseBedtime24h = (bedtime: string): { hour: string; minute: string; period: Period } => {
  const [h, m] = bedtime.split(':').map(n => parseInt(n, 10));
  const isPM = h >= 12;
  const displayHour = h % 12 || 12;
  return {
    hour: displayHour.toString(),
    minute: m.toString().padStart(2, '0'),
    period: isPM ? 'PM' : 'AM',
  };
};

const convert12To24Hour = (hour: number, period: Period): number => {
  if (period === 'AM') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
};

// ---- Slide 1: Welcome ----
function WelcomeSlide({ width, theme }: { width: number; theme: ThemeColors }) {
  const styles = useMemo(() => createSlideStyles(theme), [theme]);
  return (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.appName}>Timre</Text>
      <Text style={styles.tagline}>Your time, reclaimed.</Text>
      <Text style={styles.description}>
        Build daily habits, track screen-time goals, and keep your streak alive — one focused day at a time.
      </Text>
    </View>
  );
}

// ---- Slide 2: Bedtime ----
function BedtimeSlide({
  width,
  theme,
  initialBedtime,
  onBedtimeChange,
}: {
  width: number;
  theme: ThemeColors;
  initialBedtime: string;
  onBedtimeChange: (bedtime: string) => void;
}) {
  const slideStyles = useMemo(() => createSlideStyles(theme), [theme]);
  const pickerStyles = useMemo(() => createTimePickerStyles(theme), [theme]);

  const parsed = parseBedtime24h(initialBedtime);
  const [tempHour, setTempHour] = useState(parsed.hour);
  const [tempMinute, setTempMinute] = useState(parsed.minute);
  const [tempPeriod, setTempPeriod] = useState<Period>(parsed.period);

  const notifyChange = (h: string, m: string, p: Period) => {
    const hour24 = convert12To24Hour(parseInt(h, 10) || 12, p);
    const minute = (parseInt(m, 10) || 0).toString().padStart(2, '0');
    onBedtimeChange(`${hour24.toString().padStart(2, '0')}:${minute}`);
  };

  return (
    <ScrollView
      style={[slideStyles.slideScroll, { width }]}
      contentContainerStyle={slideStyles.slideScrollContent}
      scrollEnabled={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={slideStyles.slideTitle}>When do you go to bed?</Text>
      <Text style={slideStyles.slideSubtitle}>
        We'll remind you to review your day 1 hour before bedtime.
      </Text>
      <View style={pickerStyles.timePickerContainer12}>
        <View style={pickerStyles.timeInputGroup}>
          <Text style={pickerStyles.timeLabel}>Hour</Text>
          <TextInput
            style={pickerStyles.timeInput}
            value={tempHour}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              if (num === '' || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 12)) {
                setTempHour(num);
                notifyChange(num, tempMinute, tempPeriod);
              }
            }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="10"
            placeholderTextColor={theme.textTertiary}
          />
        </View>
        <Text style={pickerStyles.timeSeparator}>:</Text>
        <View style={pickerStyles.timeInputGroup}>
          <Text style={pickerStyles.timeLabel}>Minute</Text>
          <TextInput
            style={pickerStyles.timeInput}
            value={tempMinute}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) {
                setTempMinute(num);
                notifyChange(tempHour, num, tempPeriod);
              }
            }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
            placeholderTextColor={theme.textTertiary}
          />
        </View>
        <View style={pickerStyles.periodSelector}>
          {(['AM', 'PM'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[pickerStyles.periodButton, tempPeriod === p && pickerStyles.periodButtonActive]}
              onPress={() => {
                setTempPeriod(p);
                notifyChange(tempHour, tempMinute, p);
              }}
            >
              <Text style={[pickerStyles.periodText, tempPeriod === p && pickerStyles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ---- Slide 3: Goals ----
function GoalsSlide({ width, theme }: { width: number; theme: ThemeColors }) {
  const { recurringGoals, deleteRecurringGoal, addRecurringGoal } = useApp();
  const styles = useMemo(() => createSlideStyles(theme), [theme]);

  const addedNames = new Set(recurringGoals.map(g => g.name));
  const availableSuggestions = SUGGESTED_GOALS.filter(s => !addedNames.has(s.name));

  const addSuggested = (s: SuggestedGoal) => {
    if (s.type === 'app') {
      const goal: Omit<AppGoal, 'id'> = { type: 'app', name: s.name, limit: s.limit, used: 0, color: s.color, completed: false };
      addRecurringGoal(goal);
    } else {
      const goal: Omit<HabitGoal, 'id'> = { type: 'habit', name: s.name, color: s.color, completed: false };
      addRecurringGoal(goal);
    }
  };

  return (
    <ScrollView
      style={[styles.slideScroll, { width }]}
      contentContainerStyle={[styles.slideScrollContent, { justifyContent: 'center' }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.slideTitle}>Your goals</Text>
      <Text style={styles.slideSubtitle}>
        Pick suggestions below to get started. Add custom goals anytime in Settings.
      </Text>

      {recurringGoals.length > 0 && (
        <View style={styles.goalsList}>
          {recurringGoals.map(goal => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={[styles.goalDot, { backgroundColor: goal.color ?? theme.accent }]} />
              <View style={styles.goalInfo}>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalMeta}>
                  {goal.type === 'app' ? `${goal.limit} min limit` : 'Daily habit'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => deleteRecurringGoal(goal.id)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {availableSuggestions.length > 0 && (
        <>
          <Text style={styles.suggestionsLabel}>
            {recurringGoals.length > 0 ? 'Add more:' : 'Suggestions:'}
          </Text>
          <View style={styles.suggestions}>
            {availableSuggestions.map(s => (
              <TouchableOpacity
                key={s.name}
                style={[styles.suggestionChip, { borderColor: s.color }]}
                onPress={() => addSuggested(s)}
              >
                <View style={[styles.chipDot, { backgroundColor: s.color }]} />
                <Text style={styles.chipText}>{s.name}</Text>
                <Text style={[styles.chipPlus, { color: s.color }]}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ---- Slide 4: Notifications ----
function NotifSlide({
  width,
  theme,
  localBedtime,
}: {
  width: number;
  theme: ThemeColors;
  localBedtime: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const styles = useMemo(() => createSlideStyles(theme), [theme]);

  const handleToggle = async (value: boolean) => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (value) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Notifications Disabled',
            'Enable notifications in your device Settings to receive daily reminders.',
          );
          setIsToggling(false);
          return;
        }
        const [bh, bm] = localBedtime.split(':').map(n => parseInt(n, 10));
        await scheduleMorningReminder(8, 0);
        await scheduleEveningReminder(bh, bm);
        await AsyncStorage.setItem(NOTIFICATION_KEYS.ENABLED, 'true');
        setEnabled(true);
      } else {
        await cancelAllNotifications();
        await AsyncStorage.setItem(NOTIFICATION_KEYS.ENABLED, 'false');
        setEnabled(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.slideTitle}>Stay on track</Text>
      <Text style={styles.slideSubtitle}>
        Get a morning nudge to set your day and an evening reminder to review your streak.
      </Text>
      <View style={styles.toggleCard}>
        <Text style={styles.toggleLabel}>Enable daily reminders</Text>
        <Toggle value={enabled} onValueChange={handleToggle} disabled={isToggling} />
      </View>
      <Text style={styles.notifNote}>
        Morning: 8:00 AM · Evening: 1 hour before bedtime
      </Text>
    </View>
  );
}

// ---- Slide 5: Email + Privacy ----
function EmailSlide({
  width,
  theme,
  email,
  onEmailChange,
}: {
  width: number;
  theme: ThemeColors;
  email: string;
  onEmailChange: (email: string) => void;
}) {
  const slideStyles = useMemo(() => createSlideStyles(theme), [theme]);
  const pickerStyles = useMemo(() => createTimePickerStyles(theme), [theme]);
  return (
    <ScrollView
      style={[slideStyles.slideScroll, { width }]}
      contentContainerStyle={slideStyles.slideScrollContent}
      scrollEnabled={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={slideStyles.slideTitle}>Almost there!</Text>
      <Text style={slideStyles.slideSubtitle}>
        Drop your email for future sync and backup features. Totally optional.
      </Text>
      <View style={pickerStyles.inputCard}>
        <TextInput
          style={pickerStyles.input}
          value={email}
          onChangeText={onEmailChange}
          placeholder="your@email.com"
          placeholderTextColor={theme.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Text style={slideStyles.privacyNote}>
        Your data never leaves this device. No account required.
      </Text>
    </ScrollView>
  );
}

// ---- Bottom Chrome ----
function BottomChrome({
  currentSlide,
  onBack,
  onNext,
  isFinishing,
  theme,
}: {
  currentSlide: number;
  onBack: () => void;
  onNext: () => void;
  isFinishing: boolean;
  theme: ThemeColors;
}) {
  const styles = useMemo(() => createChromeStyles(theme), [theme]);
  const isLast = currentSlide === TOTAL_SLIDES - 1;
  return (
    <View style={styles.chrome}>
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentSlide ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
      <View style={styles.buttons}>
        {currentSlide === 0 ? (
          <View style={styles.spacer} />
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, isFinishing && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={isFinishing}
        >
          <Text style={styles.nextText}>{isLast ? "Let's go!" : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---- Main Screen ----
export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { bedtime, setBedtime, setUserEmail, completeOnboarding } = useApp();
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [localBedtime, setLocalBedtime] = useState(bedtime);
  const [localEmail, setLocalEmail] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [slideAreaHeight, setSlideAreaHeight] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToSlide = useCallback((index: number) => {
    Animated.timing(slideAnim, {
      toValue: -index * screenWidth,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setCurrentSlide(index);
  }, [slideAnim, screenWidth]);

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentSlide > 0) goToSlide(currentSlide - 1);
      return true;
    });
    return () => sub.remove();
  }, [currentSlide, goToSlide]));

  const finishOnboarding = async () => {
    setIsFinishing(true);
    try {
      if (localBedtime !== bedtime) await setBedtime(localBedtime);
      if (localEmail.trim()) await setUserEmail(localEmail.trim());
      await completeOnboarding();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      goToSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AnimatedBackground theme={theme} />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={{ flex: 1, width: screenWidth, overflow: 'hidden' }}
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) setSlideAreaHeight(h);
            }}
          >
            <Animated.View
              style={{
                flexDirection: 'row',
                width: screenWidth * TOTAL_SLIDES,
                height: slideAreaHeight > 0 ? slideAreaHeight : '100%',
                transform: [{ translateX: slideAnim }],
              }}
            >
              <WelcomeSlide width={screenWidth} theme={theme} />
              <BedtimeSlide
                width={screenWidth}
                theme={theme}
                initialBedtime={localBedtime}
                onBedtimeChange={setLocalBedtime}
              />
              <GoalsSlide width={screenWidth} theme={theme} />
              <NotifSlide width={screenWidth} theme={theme} localBedtime={localBedtime} />
              <EmailSlide
                width={screenWidth}
                theme={theme}
                email={localEmail}
                onEmailChange={setLocalEmail}
              />
            </Animated.View>
          </View>
          <BottomChrome
            currentSlide={currentSlide}
            onBack={handleBack}
            onNext={handleNext}
            isFinishing={isFinishing}
            theme={theme}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ---- Styles ----
const createSlideStyles = (theme: ThemeColors) => StyleSheet.create({
  // Used by View-based slides (Welcome, Notif)
  slide: {
    alignSelf: 'stretch',
    padding: 32,
    justifyContent: 'center',
  },
  // Used by ScrollView-based slides (Bedtime, Goals, Email)
  slideScroll: {
    alignSelf: 'stretch',
  },
  slideScrollContent: {
    flexGrow: 1,
    padding: 32,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 80,
    fontFamily: 'Digital7Mono',
    letterSpacing: 6,
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.accent,
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  goalsList: {
    gap: 10,
    marginBottom: 4,
  },
  goalCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  goalMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.closeButtonBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: 'bold',
  },
  suggestionsLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: theme.surface,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  chipPlus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: theme.textPrimary,
  },
  notifNote: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
  },
  privacyNote: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});

const createTimePickerStyles = (theme: ThemeColors) => StyleSheet.create({
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
  inputCard: { backgroundColor: theme.surface, borderRadius: 12, overflow: 'hidden' },
  input: { padding: 16, fontSize: 16, color: theme.textPrimary },
});

const createChromeStyles = (theme: ThemeColors) => StyleSheet.create({
  chrome: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: theme.border,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  spacer: { flex: 1 },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.border,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
