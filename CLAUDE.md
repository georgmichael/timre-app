# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web version
```

## Architecture Overview

This is a React Native Expo app for daily goal tracking with a streak system. The app uses React Navigation for screen management and React Context for global state.

### State Management

All app state lives in `context/AppContext.js` via a single `AppProvider` context:
- **User settings**: bedtime, email
- **Streak system**: currentStreak, longestStreak, streakSavers (0-7 "lives" to preserve streaks)
- **Recurring goals**: Two types - `app` (with time limits) and `habit` (boolean completion)
- **Daily intentions**: User-defined daily tasks (stretch goals that earn streak savers)

Access state via the `useApp()` hook in any component.

### Navigation Flow

`App.js` defines a native stack navigator with four screens:
1. **HomeScreen** - Main dashboard showing streak, time saved, goals, and intentions
2. **MorningCheckInScreen** - Daily planning flow (auto-navigated on new day)
3. **EveningReviewScreen** - End-of-day review and streak calculation (available 1 hour before bedtime)
4. **GoalsSettingsScreen** - Manage recurring goals (add/delete app limits and habits)

### Day Lifecycle

The app uses a 3am day boundary (not midnight). Key functions in AppContext:
- `isNewDay()` - Checks if day reset needed
- `startNewDay()` - Resets all daily state
- `completeDay(useSaver)` - Calculates streak outcome

### Streak Saver System

- Completing all recurring goals increments streak
- Completing 1-2 daily intentions earns 1 streak saver; 3+ earns 2
- Savers (max 7) can be used to preserve streak when goals aren't met
- Using a saver maintains streak without incrementing it

### Styling

Dark theme throughout using Tailwind-like color palette (slate colors). Background: `#0f172a`, cards: `#1e293b`, accent: `#3b82f6`.
