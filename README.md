# Timre App 🎯

A React Native mobile app built with Expo to help you stay focused and build better habits through daily intentions and recurring goals.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-~54.0-000020)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **📅 Daily Intentions** - Set and track your daily goals
- **🔄 Recurring Goals** - Monitor app usage limits and daily habits
- **🔥 Streak Tracking** - Build consistency with streak counters
- **💪 Streak Savers** - Earn safety nets by completing stretch goals
- **🌙 Evening Review** - Reflect on your day and maintain your streak
- **⏰ Smart Notifications** - Get reminded at the right times
- **📊 Time Saved Tracking** - See how much time you've saved by staying within limits
- **🎨 Light / Dark / System Theme** - Appearance follows your device or your preference

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/timre-app.git
   cd timre-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 📱 Deploying to TestFlight

Want to test on your iPhone? Check out our comprehensive deployment guides:

1. **Quick Start**: Follow `DEPLOYMENT_CHECKLIST.md`
2. **Detailed Guide**: See `TESTFLIGHT_DEPLOYMENT.md`
3. **Easy Script**: Run `./deploy-testflight.sh`

### Quick Deploy

```bash
# 1. Update bundle identifier in app.json
# 2. Run the deployment script
./deploy-testflight.sh
```

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for full instructions.

## 📂 Project Structure

```
timre-app/
├── screens/              # App screens (TypeScript)
│   ├── HomeScreen.tsx
│   ├── MorningCheckInScreen.tsx
│   ├── EveningReviewScreen.tsx
│   ├── GoalsSettingsScreen.tsx
│   └── SettingsScreen.tsx
├── components/           # Reusable components
│   ├── CircularProgress.tsx
│   └── Toggle.tsx
├── context/              # React Context for state management
│   ├── AppContext.tsx     # Goals, streaks, intentions, persistence
│   └── ThemeContext.tsx   # Light/dark/system theme
├── constants/            # App-wide constants
│   ├── colors.ts         # Theme palettes, goal color palette
│   ├── defaults.ts       # Default bedtime, morning hour
│   ├── limits.ts         # MAX_STREAK_SAVERS, MAX_INTENTIONS, input limits
│   ├── storage.ts        # AsyncStorage key names
│   └── strings.ts        # Motivational quotes
├── types/                # TypeScript types and navigation types
│   ├── index.ts
│   └── navigation.ts
├── utils/                # Utility functions
│   └── notifications.ts
├── assets/               # Images, icons, fonts
├── App.tsx               # Main app component
└── app.json              # Expo configuration
```

## 🛠️ Built With

- **[React Native](https://reactnative.dev/)** - Mobile framework
- **[Expo](https://expo.dev/)** - Development platform
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React Navigation](https://reactnavigation.org/)** - Navigation library
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Local data persistence
- **[Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Push notifications

## 🔒 Security

All data is stored locally — there is no backend, no accounts, and no network calls. Security measures in place:

- **Input validation**: goal names capped at 50 chars, intentions at 200 chars, time entries at 1440 min (24 h)
- **Email validation**: regex check before persisting the email field
- **No debug logging**: `console.log/error` removed from production paths
- **OS sandbox**: AsyncStorage on iOS lives inside the app sandbox, protected by device encryption

## 🎨 Key Components

### State Management
The app uses React Context for global state management:
- **`AppContext.tsx`** — streaks, goals, intentions, persistence, business logic
- **`ThemeContext.tsx`** — light / dark / system theme, persisted preference

### Screens
- **Home Screen** - Dashboard with streak counter, time saved, and daily overview
- **Morning Check-In** - Start your day with intention setting
- **Evening Review** - Reflect and maintain your streak
- **Goals Settings** - Configure recurring goals and habits
- **Settings** - App preferences and data management

## 📊 Data Storage

All data is stored locally using AsyncStorage:
- No backend required
- Privacy-first approach
- Data persists between app sessions
- Can be reset from Settings

## 🔔 Notifications

The app uses Expo Notifications to:
- Remind you of your morning check-in
- Alert you before bedtime for evening review
- Keep you on track with your goals

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using React Native and Expo
- Inspired by the need for better digital wellness tools
- Icons and design following modern mobile UI/UX principles

## 📧 Contact

Have questions or suggestions? Feel free to open an issue!

---

**Happy focusing! 🎯💪**
