import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider, useApp } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import GoalsSettingsScreen from './screens/GoalsSettingsScreen';
import MorningCheckInScreen from './screens/MorningCheckInScreen';
import EveningReviewScreen from './screens/EveningReviewScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f172a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GoalsSettings"
          component={GoalsSettingsScreen}
          options={{ title: 'Manage Goals' }}
        />
        <Stack.Screen
          name="MorningCheckIn"
          component={MorningCheckInScreen}
          options={{ title: 'Morning Check-In' }}
        />
        <Stack.Screen
          name="EveningReview"
          component={EveningReviewScreen}
          options={{ title: 'Evening Review' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
