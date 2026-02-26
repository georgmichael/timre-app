import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/colors';
import { PomodoroScreenProps } from '../types/navigation';

type PomodoroMode = 'work' | 'short' | 'long';

const DURATIONS: Record<PomodoroMode, number> = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABELS: Record<PomodoroMode, string> = {
  work: 'Focus',
  short: 'Short Break',
  long: 'Long Break',
};

const MODE_TAB_LABELS: Record<PomodoroMode, string> = {
  work: 'Focus',
  short: 'Short',
  long: 'Long',
};

const MAX_SESSIONS = 4;
const RING_SIZE = 240;
const RING_STROKE = 12;

export default function PomodoroScreen({ navigation: _navigation }: PomodoroScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const modeColor = useMemo<Record<PomodoroMode, string>>(() => ({
    work: theme.accent,
    short: theme.success,
    long: theme.purple,
  }), [theme]);

  // Countdown — reschedules each tick for accuracy
  useEffect(() => {
    if (!isRunning || secondsLeft === 0) return;
    const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [isRunning, secondsLeft]);

  // Handle completion
  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'work') {
        setSessionsCompleted(prev => prev >= MAX_SESSIONS ? 0 : prev + 1);
      }
    }
  }, [secondsLeft, isRunning, mode]);

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setSecondsLeft(DURATIONS[newMode]);
  };

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const ss = (secondsLeft % 60).toString().padStart(2, '0');

  // SVG ring
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / DURATIONS[mode]) * circumference;
  const ringColor = modeColor[mode];

  const sessionLabel = sessionsCompleted === 0
    ? "Let's focus"
    : sessionsCompleted >= MAX_SESSIONS
      ? 'Time for a long break!'
      : `${sessionsCompleted} of ${MAX_SESSIONS} sessions done`;

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container}>

        {/* Mode Tabs */}
        <View style={styles.modeTabs}>
          {(['work', 'short', 'long'] as PomodoroMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, mode === m && { backgroundColor: modeColor[m] }]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {MODE_TAB_LABELS[m]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer Ring */}
        <View style={styles.ringWrapper}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background track */}
            <Circle
              stroke={theme.border}
              fill="none"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              strokeWidth={RING_STROKE}
            />
            {/* Progress arc */}
            <Circle
              stroke={ringColor}
              fill="none"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              strokeWidth={RING_STROKE}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          {/* Time display overlay */}
          <View style={styles.ringCenter}>
            <Text style={[styles.timeText, { color: ringColor }]}>{mm}:{ss}</Text>
            <Text style={styles.ringModeLabel}>{MODE_LABELS[mode]}</Text>
          </View>
        </View>

        {/* Session tracker */}
        <View style={styles.sessionSection}>
          <View style={styles.sessionDots}>
            {Array.from({ length: MAX_SESSIONS }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.sessionDot,
                  { backgroundColor: i < sessionsCompleted ? modeColor.work : theme.border },
                ]}
              />
            ))}
          </View>
          <Text style={styles.sessionLabel}>{sessionLabel}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.resetButton, { borderColor: theme.border }]} onPress={reset}>
            <Text style={[styles.resetIcon, { color: theme.textSecondary }]}>↺</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: ringColor }]}
            onPress={() => setIsRunning(r => !r)}
          >
            <Text style={styles.playIcon}>{isRunning ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {/* Spacer mirrors reset button to visually center the play button */}
          <View style={styles.controlSpacer} />
        </View>

      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    width: '100%',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  modeTabTextActive: {
    color: '#ffffff',
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 68,
    fontFamily: 'Digital7Mono',
    letterSpacing: 3,
    lineHeight: 76,
  },
  ringModeLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  sessionSection: {
    alignItems: 'center',
    gap: 10,
  },
  sessionDots: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sessionLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  resetButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetIcon: {
    fontSize: 26,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 30,
    color: '#ffffff',
  },
  controlSpacer: {
    width: 52,
  },
});
