import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  GoalsSettings: undefined;
  MorningCheckIn: undefined;
  EveningReview: undefined;
  Settings: undefined;
  Pomodoro: undefined;
};

export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type GoalsSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'GoalsSettings'>;
export type MorningCheckInScreenProps = NativeStackScreenProps<RootStackParamList, 'MorningCheckIn'>;
export type EveningReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'EveningReview'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type PomodoroScreenProps = NativeStackScreenProps<RootStackParamList, 'Pomodoro'>;
