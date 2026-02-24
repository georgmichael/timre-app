import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  GoalsSettings: undefined;
  MorningCheckIn: undefined;
  EveningReview: undefined;
  Settings: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type GoalsSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'GoalsSettings'>;
export type MorningCheckInScreenProps = NativeStackScreenProps<RootStackParamList, 'MorningCheckIn'>;
export type EveningReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'EveningReview'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
