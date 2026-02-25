# 📋 TestFlight Deployment Checklist

Use this checklist for your first deployment to TestFlight.

## Before You Start

- [ ] I have an Apple Developer Account ($99/year)
  - Sign up at: https://developer.apple.com
  - Make sure it's fully activated and paid

- [ ] I have an Expo account (free)
  - Sign up at: https://expo.dev

- [ ] EAS CLI is installed ✅ (Already done!)

---

## Configuration Steps

- [x] **Bundle Identifier Set**
  - `app.json` already contains `"bundleIdentifier": "com.michaelgeorge.timre"`
  - Change this if you are deploying under a different developer account

- [ ] **Update App Name (Optional)**
  - In `app.json`, change `"name": "timre-app"` to your preferred name
  - This is what users will see on their home screen

- [ ] **Check App Icon**
  - Make sure `./assets/icon.png` exists and looks good
  - Should be 1024x1024 pixels

---

## Deployment Steps

- [ ] **Login to Expo**
  ```bash
  eas login
  ```

- [ ] **Build for iOS**
  ```bash
  eas build --platform ios --profile production
  ```
  - Choose "production" when asked
  - Say "Yes" to generate credentials
  - Wait 10-20 minutes for build to complete

- [ ] **Submit to TestFlight**
  ```bash
  eas submit --platform ios --latest
  ```
  - This uploads your build to App Store Connect
  - Wait 5-30 minutes for Apple to process

---

## App Store Connect Setup

- [ ] **Go to App Store Connect**
  - Visit: https://appstoreconnect.apple.com
  - Sign in with your Apple Developer account

- [ ] **Find Your App**
  - Click "My Apps"
  - Find "Timre App" (or your app name)

- [ ] **Set Up TestFlight**
  - Click the "TestFlight" tab
  - Go to "Internal Testing"
  - Click the "+" to create a new group (if needed)
  - Add yourself as a tester using your email

---

## Install on iPhone

- [ ] **Download TestFlight**
  - Open App Store on your iPhone
  - Search for "TestFlight"
  - Install the official Apple TestFlight app

- [ ] **Accept Invitation**
  - Check your email for TestFlight invitation
  - Tap "View in TestFlight"
  - Or open TestFlight app and look for "Timre App"

- [ ] **Install Your App**
  - Tap "Install" in TestFlight
  - Wait for download
  - App appears on your home screen!

- [ ] **Test Everything**
  - Open the app
  - Test all features
  - Check for any bugs or issues

---

## For Future Updates

When you make changes and want to update:

- [ ] Make your code changes
- [ ] Test locally with `npm start`
- [ ] Build number will auto-increment (thanks to `eas.json`)
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Run: `eas submit --platform ios --latest`
- [ ] Wait for processing
- [ ] Update appears in TestFlight automatically!

---

## Quick Commands

```bash
# Easy way - Use the deployment script
./deploy-testflight.sh

# Manual way
eas login                                    # Login
eas build --platform ios --profile production  # Build
eas submit --platform ios --latest           # Submit
eas build:list                               # Check status
```

---

## Troubleshooting

**Build failed?**
- Run `eas build:view` to see logs
- Check that `app.json` is valid JSON
- Make sure bundle identifier is unique

**Not showing in TestFlight?**
- Check App Store Connect for processing status
- Make sure you added yourself as a tester
- Check spam folder for invitation email

**Can't login to Expo?**
- Create account at https://expo.dev first
- Then run `eas login`

---

## Resources

- 📖 Full Guide: See `TESTFLIGHT_DEPLOYMENT.md`
- 🌐 Expo Docs: https://docs.expo.dev/build/introduction/
- 🍎 TestFlight Guide: https://developer.apple.com/testflight/
- 💬 Expo Forums: https://forums.expo.dev/

---

**Ready to deploy? Let's go! 🚀**

Start with:
```bash
./deploy-testflight.sh
```

Or follow the manual steps in `TESTFLIGHT_DEPLOYMENT.md`
