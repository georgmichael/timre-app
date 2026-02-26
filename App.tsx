import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { RootStackParamList } from './types/navigation';
import HomeScreen from './screens/HomeScreen';
import GoalsSettingsScreen from './screens/GoalsSettingsScreen';
import MorningCheckInScreen from './screens/MorningCheckInScreen';
import EveningReviewScreen from './screens/EveningReviewScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PomodoroScreen from './screens/PomodoroScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { isLoading, hasOnboarded } = useApp();
  const { theme } = useTheme();
  const [fontsLoaded] = useFonts({
    Digital7Mono: require('./assets/fonts/Digital7Mono.ttf'),
  });

  if (isLoading || !fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={hasOnboarded ? 'Home' : 'Onboarding'}
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GoalsSettings" component={GoalsSettingsScreen} options={{ title: 'Manage Goals' }} />
        <Stack.Screen name="MorningCheckIn" component={MorningCheckInScreen} options={{ title: 'Morning Check-In' }} />
        <Stack.Screen name="EveningReview" component={EveningReviewScreen} options={{ title: 'Evening Review' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Pomodoro" component={PomodoroScreen} options={{ title: 'Focus Timer' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
