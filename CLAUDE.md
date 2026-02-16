# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm start          # Start Expo development server (Expo Go)
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web version
npx expo run:ios   # Build custom dev client for iOS
npx expo run:android  # Build custom dev client for Android
```

## Architecture Overview

This is a React Native Expo app for daily goal tracking with a streak system. The app uses React Navigation for screen management, React Context for global state, and AsyncStorage for persistence.

### State Management

All app state lives in `context/AppContext.js` via a single `AppProvider` context with AsyncStorage persistence:
- **User settings**: bedtime, email (persisted)
- **Streak system**: currentStreak, longestStreak, streakSavers 0-7 (persisted)
- **Recurring goals**: Two types - `app` (with time limits and usage tracking) and `habit` (boolean)
- **Daily intentions**: User-defined daily tasks (stretch goals that earn streak savers)
- **isLoading**: Loading state while AsyncStorage loads

All state mutations use async functions that persist to AsyncStorage. Access via `useApp()` hook.

### Navigation Flow

`App.js` defines a native stack navigator with five screens:
1. **HomeScreen** - Dashboard with streak, time saved, goals (tappable for time logging), intentions
2. **MorningCheckInScreen** - Daily planning (auto-navigates on new day)
3. **EveningReviewScreen** - End-of-day review (available 1 hour before bedtime)
4. **GoalsSettingsScreen** - Manage recurring goals
5. **SettingsScreen** - Bedtime, notifications, email, reset data

### Day Lifecycle

The app uses a 3am day boundary (not midnight). Key functions:
- `isNewDay()` - Checks if day reset needed based on lastOpenedDate
- `startNewDay()` - Resets goals/intentions, updates lastOpenedDate
- `completeDay(useSaver)` - Calculates streak outcome

### Notifications

Push notifications via expo-notifications (`utils/notifications.js`):
- Morning reminder (user-configurable time)
- Evening review reminder (1 hour before bedtime)
- Configured in SettingsScreen, stored in AsyncStorage

### App Time Tracking

App goals support manual time logging:
- Tap any app goal on HomeScreen to open time logging modal
- Quick-add buttons (+5, +10, +15, +30 minutes)
- Time persists and affects "minutes saved" calculation

### Key Files

- `context/AppContext.js` - All state, persistence, business logic
- `utils/notifications.js` - Notification scheduling
- `screens/HomeScreen.js` - Main UI with time logging modal
- `screens/SettingsScreen.js` - User preferences and notification settings

### Styling

Dark theme using Tailwind-like slate palette:
- Background: `#0f172a`
- Cards: `#1e293b`
- Accent: `#3b82f6`
- Success: `#22c55e`
