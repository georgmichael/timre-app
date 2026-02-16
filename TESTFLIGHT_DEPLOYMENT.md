# 📱 Deploying Timre App to TestFlight

This guide will walk you through deploying your React Native Expo app to TestFlight so you can test it on your iPhone.

## ✅ Prerequisites Checklist

- [ ] **Apple Developer Account** - Sign up at [developer.apple.com](https://developer.apple.com) ($99/year)
- [ ] **Expo Account** - Free account at [expo.dev](https://expo.dev)
- [ ] **EAS CLI installed** - ✅ Already installed!

---

## 🚀 Step-by-Step Deployment Process

### Step 1: Configure Your Bundle Identifier

**⚠️ IMPORTANT:** You need to change the bundle identifier in `app.json` to something unique.

Open `app.json` and change this line:
```json
"bundleIdentifier": "com.yourname.timreapp"
```

To something like:
```json
"bundleIdentifier": "com.michaelgeorge.timreapp"
```

The format should be: `com.yourname.appname` (all lowercase, no spaces)

---

### Step 2: Login to Expo

Run this command in your terminal:

```bash
eas login
```

If you don't have an Expo account, you can create one during this step.

---

### Step 3: Configure EAS Build

Initialize EAS in your project:

```bash
eas build:configure
```

This will create an `eas.json` file with build configurations.

---

### Step 4: Create Your First iOS Build

Build your app for iOS:

```bash
eas build --platform ios
```

**What happens:**
1. EAS will ask you to log in to your Apple Developer account
2. It will automatically create the necessary certificates and provisioning profiles
3. Your app will be built in the cloud (takes 10-20 minutes)
4. You'll get a download link when it's done

**Choose these options when prompted:**
- Build type: `production` (for TestFlight)
- Generate new credentials: `Yes` (first time)

---

### Step 5: Submit to TestFlight

Once the build is complete, submit it to TestFlight:

```bash
eas submit --platform ios
```

**What happens:**
1. EAS will upload your build to App Store Connect
2. Apple will process it (takes 5-30 minutes)
3. You'll receive an email when it's ready for testing

---

### Step 6: Set Up TestFlight

1. **Go to App Store Connect:**
   - Visit [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Sign in with your Apple Developer account

2. **Find Your App:**
   - Click on "My Apps"
   - Select "Timre App"

3. **Add Yourself as a Tester:**
   - Go to the "TestFlight" tab
   - Click "Internal Testing" or "External Testing"
   - Add your email address as a tester

4. **Install TestFlight on Your iPhone:**
   - Download "TestFlight" from the App Store
   - Sign in with the same Apple ID
   - You'll see "Timre App" available to install

---

## 🔄 Making Updates

When you make changes and want to update TestFlight:

1. **Increment the build number** in `app.json`:
   ```json
   "buildNumber": "2"  // was "1"
   ```

2. **Build again:**
   ```bash
   eas build --platform ios
   ```

3. **Submit again:**
   ```bash
   eas submit --platform ios
   ```

---

## 📋 Quick Command Reference

```bash
# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios

# Check build status
eas build:list

# View build logs
eas build:view
```

---

## 🐛 Common Issues & Solutions

### Issue: "Bundle identifier already in use"
**Solution:** Change the `bundleIdentifier` in `app.json` to something unique.

### Issue: "Apple Developer account not found"
**Solution:** Make sure you've enrolled in the Apple Developer Program at [developer.apple.com](https://developer.apple.com).

### Issue: "Build failed"
**Solution:** Run `eas build:view` to see detailed logs. Common fixes:
- Make sure all dependencies are installed: `npm install`
- Check that your `app.json` is valid JSON
- Ensure your Expo SDK version is compatible

### Issue: "App not showing in TestFlight"
**Solution:** 
- Check App Store Connect for processing status
- Make sure you added yourself as a tester
- Check your email for TestFlight invitation

---

## 💡 Pro Tips

1. **Use Internal Testing first** - It's faster (no review needed) and perfect for personal testing

2. **Keep build numbers sequential** - Always increment the build number for each new build

3. **Test locally first** - Run `expo start --ios` to test on the iOS simulator before building

4. **Check build status** - Use `eas build:list` to see all your builds and their status

5. **Save your credentials** - EAS will manage your certificates, but you can download them from the Expo dashboard if needed

---

## 📱 Testing on Your iPhone

Once your app is in TestFlight:

1. Open TestFlight app on your iPhone
2. Tap on "Timre App"
3. Tap "Install"
4. The app will appear on your home screen
5. Test all features!

---

## 🎯 Next Steps After TestFlight

When you're ready to publish to the App Store:

1. Prepare app store assets (screenshots, description, etc.)
2. Submit for App Store review
3. Wait for approval (typically 1-3 days)
4. Release to the public!

---

## 📞 Need Help?

- **Expo Documentation:** [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction/)
- **EAS Build Guide:** [docs.expo.dev/build/setup](https://docs.expo.dev/build/setup/)
- **TestFlight Guide:** [developer.apple.com/testflight](https://developer.apple.com/testflight/)

---

**Good luck with your deployment! 🚀**
